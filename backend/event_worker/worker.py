"""
CloudForge Event Worker Lambda
Triggered by Amazon SQS (cloudforge-file-events-queue),
which receives S3 Object Created and Object Deleted events routed from Amazon EventBridge.

Responsibilities:
1. Parse S3 event details from SQS message batch
2. Filter out internal snapshot paths (/snapshots/) to prevent event loops
3. Fetch object metadata from S3 (e.g. uploadedby, category)
4. Record new version entry in DynamoDB table: CloudForge_FileVersions
5. Recalculate/update totalStorageBytes in DynamoDB table: CloudForge_Projects
6. Write audit trail entry to DynamoDB table: CloudForge_ActivityLogs
"""

import json
import os
import logging
from datetime import datetime, timezone
from decimal import Decimal
from typing import Dict, Any, List, Optional
from urllib.parse import unquote_plus

import boto3
from botocore.exceptions import BotoCoreError, ClientError

logger = logging.getLogger("cloudforge_worker")
logger.setLevel(logging.INFO)

AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")
PROJECTS_TABLE = os.environ.get("PROJECTS_TABLE", "CloudForge_Projects")
FILE_VERSIONS_TABLE = os.environ.get("FILE_VERSIONS_TABLE", "CloudForge_FileVersions")
ACTIVITY_LOGS_TABLE = os.environ.get("ACTIVITY_LOGS_TABLE", "CloudForge_ActivityLogs")

s3_client = boto3.client("s3", region_name=AWS_REGION)
dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
projects_tbl = dynamodb.Table(PROJECTS_TABLE)
file_versions_tbl = dynamodb.Table(FILE_VERSIONS_TABLE)
activity_logs_tbl = dynamodb.Table(ACTIVITY_LOGS_TABLE)


def calculate_project_storage(bucket_name: str, project_id: str) -> int:
    """Sum the byte size of all active files under projects/{projectId}/."""
    prefix = f"projects/{project_id}/"
    total_bytes = 0
    paginator = s3_client.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=bucket_name, Prefix=prefix):
        for obj in page.get("Contents", []):
            total_bytes += obj.get("Size", 0)
    return total_bytes


def process_s3_event(event_detail: Dict[str, Any], event_time: Optional[str] = None):
    """
    Process an individual EventBridge S3 notification.
    Expected schema:
    detail: {
      "version": "0",
      "bucket": { "name": "..." },
      "object": {
        "key": "projects/{projectId}/{fileName}",
        "size": 1024,
        "version-id": "...",
        "etag": "..."
      },
      "reason": "PutObject"
    }
    """
    bucket_info = event_detail.get("bucket", {})
    bucket_name = bucket_info.get("name")
    object_info = event_detail.get("object", {})
    s3_key = unquote_plus(object_info.get("key", ""))
    size_bytes = object_info.get("size", 0)
    version_id = object_info.get("version-id") or object_info.get("versionId") or "null"

    if not s3_key or not bucket_name:
        logger.warning(f"Skipping event with missing key or bucket: {event_detail}")
        return

    # 1. Prevent recursion: Ignore snapshots and temp directories
    if s3_key.startswith("snapshots/") or "/snapshots/" in s3_key or s3_key.endswith("/"):
        logger.info(f"Ignoring snapshot/directory key: {s3_key}")
        return

    # Check key structure: must match projects/{projectId}/{fileName}
    parts = s3_key.split("/")
    if len(parts) < 3 or parts[0] != "projects":
        logger.info(f"Key does not match project workspace pattern (projects/{{projectId}}/...): {s3_key}")
        return

    project_id = parts[1]
    file_name = "/".join(parts[2:])
    file_id = f"{project_id}/{file_name}"
    now_iso = event_time or datetime.now(timezone.utc).isoformat()
    is_delete = event_detail.get("reason", "").lower() in {
        "deleteobject",
        "deletemarkercreated",
        "permanentlydeleted",
    }

    # 2. Extract S3 user metadata if available
    uploaded_by = "Unknown"
    category = "General"
    if not is_delete:
        head_params = {"Bucket": bucket_name, "Key": s3_key}
        if version_id != "null":
            head_params["VersionId"] = version_id
        meta = s3_client.head_object(**head_params).get("Metadata", {})
        uploaded_by = meta.get("uploadedby", uploaded_by)
        category = meta.get("category", category)

    # 3. Insert or update CloudForge_FileVersions table
    if not is_delete:
        logger.info("Recording file version: fileId=%s, versionId=%s, size=%s", file_id, version_id, size_bytes)
        file_versions_tbl.put_item(
            Item={
                "fileId": file_id,
                "versionId": version_id,
                "projectId": project_id,
                "fileName": file_name,
                "sizeBytes": Decimal(str(size_bytes)),
                "uploadedBy": uploaded_by,
                "uploadedAt": now_iso,
                "s3Key": s3_key,
                "category": category
            }
        )

    # 4. Update totalStorageBytes on CloudForge_Projects
    total_storage = calculate_project_storage(bucket_name, project_id)
    projects_tbl.update_item(
        Key={"projectId": project_id},
        UpdateExpression="SET totalStorageBytes = :s, lastActivityAt = :la",
        ExpressionAttributeValues={
            ":s": Decimal(str(total_storage)),
            ":la": now_iso
        }
    )

    # 5. Insert FILE_UPLOADED audit log into CloudForge_ActivityLogs
    action = "FILE_DELETED" if is_delete else "FILE_UPLOADED"
    details = (
        f"Deleted '{file_name}' from the project."
        if is_delete
        else f"Uploaded '{file_name}' ({size_bytes} bytes, S3 version: {version_id[:10]}...)"
    )
    activity_logs_tbl.put_item(
        Item={
            "projectId": project_id,
            "timestamp": now_iso,
            "action": action,
            "actor": uploaded_by,
            "details": details
        }
    )


def lambda_handler(event: Dict[str, Any], context: Any):
    """
    Main entry point for SQS triggers.
    Parses SQS Records containing EventBridge payloads.
    """
    records: List[Dict[str, Any]] = event.get("Records", [])
    logger.info(f"Event worker received {len(records)} SQS records.")

    batch_item_failures = []
    for record in records:
        body_str = record.get("body", "{}")
        try:
            body = json.loads(body_str)
            
            # EventBridge envelope wrapping S3 event
            if "detail" in body and body.get("source") == "aws.s3":
                detail = body["detail"]
                process_s3_event(detail, body.get("time"))
            # Direct S3 Test Event or raw payload
            elif "Records" in body:
                for s3_rec in body.get("Records", []):
                    s3_data = s3_rec.get("s3", {})
                    detail = {
                        "bucket": {"name": s3_data.get("bucket", {}).get("name")},
                        "object": {
                            "key": s3_data.get("object", {}).get("key"),
                            "size": s3_data.get("object", {}).get("size", 0),
                            "version-id": s3_data.get("object", {}).get("versionId", "null")
                        },
                        "reason": (
                            "DeleteObject"
                            if s3_rec.get("eventName", "").startswith("ObjectRemoved")
                            else "PutObject"
                        ),
                    }
                    process_s3_event(detail, s3_rec.get("eventTime"))
            else:
                raise ValueError("Unrecognized SQS message structure.")
        except (json.JSONDecodeError, BotoCoreError, ClientError, KeyError, TypeError, ValueError):
            message_id = record.get("messageId")
            logger.exception("Failed to process SQS record %s", message_id)
            if message_id:
                batch_item_failures.append({"itemIdentifier": message_id})

    return {"batchItemFailures": batch_item_failures}
