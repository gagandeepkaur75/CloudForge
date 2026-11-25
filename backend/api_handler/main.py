"""
CloudForge REST API Handler
FastAPI backend running on AWS Lambda via Mangum.
Protected by Amazon Cognito JWT Authorizer.
"""

import os
import io
import time
import uuid
import zipfile
import logging
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional, Dict, Any

import boto3
from botocore.exceptions import ClientError
from fastapi import FastAPI, HTTPException, Depends, Request, status, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from mangum import Mangum

# Setup logger
logger = logging.getLogger("cloudforge_api")
logger.setLevel(logging.INFO)

# Environment configuration
S3_BUCKET = os.environ.get("CLOUDFORGE_S3_BUCKET", "cloudforge-storage-bucket")
PROJECTS_TABLE = os.environ.get("PROJECTS_TABLE", "CloudForge_Projects")
FILE_VERSIONS_TABLE = os.environ.get("FILE_VERSIONS_TABLE", "CloudForge_FileVersions")
ACTIVITY_LOGS_TABLE = os.environ.get("ACTIVITY_LOGS_TABLE", "CloudForge_ActivityLogs")
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")

# AWS Clients
s3_client = boto3.client("s3", region_name=AWS_REGION)
dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
projects_tbl = dynamodb.Table(PROJECTS_TABLE)
file_versions_tbl = dynamodb.Table(FILE_VERSIONS_TABLE)
activity_logs_tbl = dynamodb.Table(ACTIVITY_LOGS_TABLE)

# FastAPI App
app = FastAPI(
    title="CloudForge API",
    description="Advanced Cloud-Based Collaborative Project Workspace Backend",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Helper: Decimal conversion for DynamoDB responses
def decimal_to_native(val: Any) -> Any:
    if isinstance(val, list):
        return [decimal_to_native(i) for i in val]
    elif isinstance(val, dict):
        return {k: decimal_to_native(v) for k, v in val.items()}
    elif isinstance(val, Decimal):
        if val % 1 == 0:
            return int(val)
        else:
            return float(val)
    return val


# User context helper
class UserContext(BaseModel):
    email: str
    roles: List[str] = []
    is_lead: bool = False


def get_current_user(request: Request) -> UserContext:
    """
    Extract user email and roles from Cognito Authorizer claims in API Gateway
    or fallback to development headers for local testing.
    """
    email = "anonymous@student.edu"
    roles = ["Contributor"]

    # Check API Gateway / Mangum lambda context
    scope = request.scope
    aws_event = scope.get("aws.event", {})
    request_context = aws_event.get("requestContext", {})
    authorizer = request_context.get("authorizer", {})
    claims = authorizer.get("claims", {})

    if claims:
        email = claims.get("email") or claims.get("cognito:username") or email
        groups = claims.get("cognito:groups", "")
        if isinstance(groups, str) and groups:
            roles = [g.strip() for g in groups.split(",")]
        elif isinstance(groups, list):
            roles = groups
    else:
        # Fallback to test/dev headers
        hdr_email = request.headers.get("X-User-Email")
        hdr_roles = request.headers.get("X-User-Roles")
        if hdr_email:
            email = hdr_email
        if hdr_roles:
            roles = [r.strip() for r in hdr_roles.split(",")]

    is_lead = "ProjectLead" in roles or "admin" in roles
    return UserContext(email=email, roles=roles, is_lead=is_lead)


def log_activity(project_id: str, action: str, actor: str, details: str):
    """Log an event into CloudForge_ActivityLogs table."""
    try:
        now_iso = datetime.now(timezone.utc).isoformat()
        activity_logs_tbl.put_item(
            Item={
                "projectId": project_id,
                "timestamp": now_iso,
                "action": action,
                "actor": actor,
                "details": details
            }
        )
    except Exception as e:
        logger.error(f"Failed to write activity log: {str(e)}")


# ---------------------------------------------------------------------------
# Request/Response Models
# ---------------------------------------------------------------------------
class ProjectCreateRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=100)
    description: str = Field(..., max_length=500)


class MemberInviteRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=120)
    role: Optional[str] = "Contributor"


class UploadUrlRequest(BaseModel):
    fileName: str = Field(..., min_length=1, max_length=255)
    fileType: Optional[str] = "application/octet-stream"
    category: Optional[str] = "General"


class VersionRecoverRequest(BaseModel):
    versionId: str = Field(..., min_length=1)


class ShareUrlRequest(BaseModel):
    expiryMinutes: int = Field(default=60, ge=15, le=1440)  # 15m to 24h


# ---------------------------------------------------------------------------
# REST Endpoints
# ---------------------------------------------------------------------------

@app.get("/health", tags=["System"])
def health_check():
    return {"status": "ok", "service": "CloudForge API", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.get("/projects", tags=["Projects"])
def list_projects(user: UserContext = Depends(get_current_user)):
    """
    List all projects where the authenticated user is an owner or member.
    """
    try:
        # Full scan with filter for user email
        response = projects_tbl.scan()
        items = response.get("Items", [])
        
        user_projects = []
        for p in items:
            p_clean = decimal_to_native(p)
            members = p_clean.get("members", [])
            owner = p_clean.get("ownerEmail", "")
            # Project leads or team members have access
            if user.is_lead or user.email == owner or user.email in members:
                user_projects.append(p_clean)

        return {"projects": user_projects}
    except ClientError as e:
        logger.error(f"Error fetching projects: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/projects", status_code=status.HTTP_201_CREATED, tags=["Projects"])
def create_project(req: ProjectCreateRequest, user: UserContext = Depends(get_current_user)):
    """
    Create a new project workspace. The creator becomes the owner and ProjectLead.
    """
    project_id = f"proj-{uuid.uuid4().hex[:10]}"
    now_iso = datetime.now(timezone.utc).isoformat()

    item = {
        "projectId": project_id,
        "title": req.title,
        "description": req.description,
        "ownerEmail": user.email,
        "members": [user.email],
        "totalStorageBytes": 0,
        "createdAt": now_iso,
        "snapshotStatus": "NONE"
    }

    try:
        projects_tbl.put_item(Item=item)
        log_activity(
            project_id=project_id,
            action="PROJECT_CREATED",
            actor=user.email,
            details=f"Project '{req.title}' created by {user.email}"
        )
        return decimal_to_native(item)
    except ClientError as e:
        logger.error(f"Error creating project: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/projects/{projectId}", tags=["Projects"])
def get_project_details(projectId: str, user: UserContext = Depends(get_current_user)):
    """
    Get detailed information about a specific project.
    """
    try:
        res = projects_tbl.get_item(Key={"projectId": projectId})
        item = res.get("Item")
        if not item:
            raise HTTPException(status_code=404, detail="Project not found")
        return decimal_to_native(item)
    except ClientError as e:
        logger.error(f"Error getting project {projectId}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/projects/{projectId}/members", tags=["Projects"])
def invite_member(projectId: str, req: MemberInviteRequest, user: UserContext = Depends(get_current_user)):
    """
    Invite a team member by email. Restricted to ProjectLead role or Project Owner.
    """
    try:
        res = projects_tbl.get_item(Key={"projectId": projectId})
        project = res.get("Item")
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        # RBAC Check: Must be ProjectLead or project owner
        is_owner = project.get("ownerEmail") == user.email
        if not (user.is_lead or is_owner):
            raise HTTPException(
                status_code=403, 
                detail="Only a ProjectLead or project owner can invite new members."
            )

        members = project.get("members", [])
        if req.email in members:
            return {"message": f"{req.email} is already a member of this project.", "members": members}

        members.append(req.email)
        projects_tbl.update_item(
            Key={"projectId": projectId},
            UpdateExpression="SET members = :m",
            ExpressionAttributeValues={":m": members}
        )

        log_activity(
            project_id=projectId,
            action="MEMBER_ADDED",
            actor=user.email,
            details=f"Invited {req.email} to the team"
        )

        return {"message": f"Successfully invited {req.email}", "members": members}
    except ClientError as e:
        logger.error(f"Error adding member: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/projects/{projectId}/upload-url", tags=["Files"])
def generate_upload_url(projectId: str, req: UploadUrlRequest, user: UserContext = Depends(get_current_user)):
    """
    Generate an Amazon S3 Pre-Signed PUT URL (expires in 300 seconds)
    for direct, secure browser-to-S3 file upload with zero server bottleneck.
    """
    # Key convention: projects/{projectId}/{fileName}
    s3_key = f"projects/{projectId}/{req.fileName}"

    try:
        presigned_url = s3_client.generate_presigned_url(
            ClientMethod="put_object",
            Params={
                "Bucket": S3_BUCKET,
                "Key": s3_key,
                "ContentType": req.fileType,
                "Metadata": {
                    "uploadedby": user.email,
                    "projectid": projectId,
                    "category": req.category or "General"
                }
            },
            ExpiresIn=300
        )

        return {
            "uploadUrl": presigned_url,
            "s3Key": s3_key,
            "expiresIn": 300,
            "fileName": req.fileName
        }
    except ClientError as e:
        logger.error(f"Error creating pre-signed PUT URL: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate upload URL: {str(e)}")


@app.get("/projects/{projectId}/files", tags=["Files"])
def list_project_files(projectId: str, user: UserContext = Depends(get_current_user)):
    """
    List active files and their latest metadata, versions count, and storage sizes.
    """
    prefix = f"projects/{projectId}/"
    try:
        # Fetch latest objects from S3
        response = s3_client.list_objects_v2(Bucket=S3_BUCKET, Prefix=prefix)
        contents = response.get("Contents", [])

        files_list = []
        for obj in contents:
            s3_key = obj["Key"]
            file_name = s3_key.replace(prefix, "")
            if not file_name or file_name.endswith("/"):
                continue

            # Determine category based on file extension
            ext = file_name.split(".")[-1].lower() if "." in file_name else ""
            if ext in ["py", "js", "jsx", "ts", "tsx", "html", "css", "java", "cpp", "c", "sh"]:
                category = "Source Code"
            elif ext in ["csv", "json", "parquet", "xlsx", "xml", "h5", "sql"]:
                category = "Dataset"
            elif ext in ["pdf", "docx", "doc", "md", "txt", "rtf"]:
                category = "Report & Docs"
            elif ext in ["pptx", "ppt", "key"]:
                category = "Presentation"
            else:
                category = "General"

            # Check version count via DynamoDB or S3
            file_id = f"{projectId}/{file_name}"
            version_count = 1
            try:
                ver_res = file_versions_tbl.query(
                    KeyConditionExpression="fileId = :fid",
                    ExpressionAttributeValues={":fid": file_id}
                )
                items = ver_res.get("Items", [])
                if items:
                    version_count = len(items)
            except Exception:
                pass

            files_list.append({
                "fileName": file_name,
                "s3Key": s3_key,
                "sizeBytes": obj["Size"],
                "lastModified": obj["LastModified"].isoformat(),
                "category": category,
                "versionCount": version_count,
                "eTag": obj.get("ETag", "").strip('"')
            })

        return {"files": files_list}
    except ClientError as e:
        logger.error(f"Error listing files for project {projectId}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/projects/{projectId}/files/{fileName}/versions", tags=["Files"])
def get_file_versions(projectId: str, fileName: str, user: UserContext = Depends(get_current_user)):
    """
    Fetch all historical S3 versions for a given file.
    Combines DynamoDB metadata with S3 version metadata.
    """
    s3_key = f"projects/{projectId}/{fileName}"
    file_id = f"{projectId}/{fileName}"

    try:
        # Check S3 list_object_versions
        s3_versions_res = s3_client.list_object_versions(Bucket=S3_BUCKET, Prefix=s3_key)
        raw_versions = s3_versions_res.get("Versions", [])

        # Also query DynamoDB CloudForge_FileVersions for rich metadata
        db_versions = {}
        try:
            ver_res = file_versions_tbl.query(
                KeyConditionExpression="fileId = :fid",
                ExpressionAttributeValues={":fid": file_id}
            )
            for v in ver_res.get("Items", []):
                db_versions[v.get("versionId")] = decimal_to_native(v)
        except Exception as e:
            logger.warning(f"Could not query DynamoDB versions: {e}")

        versions = []
        for i, ver in enumerate(raw_versions):
            if ver["Key"] != s3_key:
                continue
            ver_id = ver["VersionId"]
            db_meta = db_versions.get(ver_id, {})

            versions.append({
                "versionId": ver_id,
                "isLatest": ver.get("IsLatest", False),
                "lastModified": ver["LastModified"].isoformat(),
                "sizeBytes": ver["Size"],
                "uploadedBy": db_meta.get("uploadedBy", "Team Member"),
                "uploadedAt": db_meta.get("uploadedAt", ver["LastModified"].isoformat()),
                "label": f"v{len(raw_versions) - i}"
            })

        return {"fileName": fileName, "versions": versions}
    except ClientError as e:
        logger.error(f"Error fetching versions for {fileName}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/projects/{projectId}/files/{fileName}/recover", tags=["Files"])
def recover_file_version(projectId: str, fileName: str, req: VersionRecoverRequest, user: UserContext = Depends(get_current_user)):
    """
    Restore a specific S3 versionId by copying that historical object version
    onto the current key (s3.copy_object with VersionId).
    Logs VERSION_RECOVERED in CloudForge_ActivityLogs.
    """
    s3_key = f"projects/{projectId}/{fileName}"

    try:
        # S3 copy_object restores by creating a new latest version pointing to that snapshot
        copy_source = {
            "Bucket": S3_BUCKET,
            "Key": s3_key,
            "VersionId": req.versionId
        }

        res = s3_client.copy_object(
            Bucket=S3_BUCKET,
            Key=s3_key,
            CopySource=copy_source,
            MetadataDirective="COPY"
        )
        new_version_id = res.get("VersionId", "newest")

        # Record in DynamoDB Activity Logs
        log_activity(
            project_id=projectId,
            action="VERSION_RECOVERED",
            actor=user.email,
            details=f"Restored '{fileName}' to versionId '{req.versionId[:10]}...' (Created new version {new_version_id[:10]}...)"
        )

        return {
            "message": f"Successfully restored '{fileName}' from version {req.versionId}",
            "newVersionId": new_version_id,
            "fileName": fileName
        }
    except ClientError as e:
        logger.error(f"Error recovering file {fileName}: {e}")
        raise HTTPException(status_code=500, detail=f"Recovery failed: {str(e)}")


@app.post("/projects/{projectId}/files/{fileName}/share", tags=["Files"])
def generate_share_url(projectId: str, fileName: str, req: ShareUrlRequest, user: UserContext = Depends(get_current_user)):
    """
    Generate a temporary, time-limited S3 Pre-Signed GET URL for secure external sharing.
    Configurable expiry (15m, 1h, 24h).
    Logs LINK_SHARED in CloudForge_ActivityLogs.
    """
    s3_key = f"projects/{projectId}/{fileName}"
    expires_in_secs = req.expiryMinutes * 60

    try:
        presigned_url = s3_client.generate_presigned_url(
            ClientMethod="get_object",
            Params={
                "Bucket": S3_BUCKET,
                "Key": s3_key,
                "ResponseContentDisposition": f'attachment; filename="{fileName}"'
            },
            ExpiresIn=expires_in_secs
        )

        # Log sharing activity
        log_activity(
            project_id=projectId,
            action="LINK_SHARED",
            actor=user.email,
            details=f"Shared temporary link for '{fileName}' valid for {req.expiryMinutes} minutes"
        )

        return {
            "shareUrl": presigned_url,
            "fileName": fileName,
            "expiresInMinutes": req.expiryMinutes,
            "expiresAt": datetime.fromtimestamp(time.time() + expires_in_secs, timezone.utc).isoformat()
        }
    except ClientError as e:
        logger.error(f"Error generating share URL for {fileName}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/projects/{projectId}/snapshot", tags=["Snapshots"])
def create_final_submission_snapshot(projectId: str, user: UserContext = Depends(get_current_user)):
    """
    Create an immutable final submission snapshot:
    1. Copies all current project files into s3://{bucket}/snapshots/{projectId}/{timestamp}/
    2. Builds an in-memory .zip package containing all files and uploads to S3
    3. Updates snapshotStatus="SUBMITTED" in CloudForge_Projects
    4. Logs SNAPSHOT_CREATED in CloudForge_ActivityLogs
    """
    prefix = f"projects/{projectId}/"
    timestamp_slug = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    snapshot_prefix = f"snapshots/{projectId}/{timestamp_slug}/"
    zip_key = f"{snapshot_prefix}final_submission_{projectId}_{timestamp_slug}.zip"

    try:
        # Check project exists
        res = projects_tbl.get_item(Key={"projectId": projectId})
        project = res.get("Item")
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        # List all current files
        list_res = s3_client.list_objects_v2(Bucket=S3_BUCKET, Prefix=prefix)
        contents = list_res.get("Contents", [])

        if not contents:
            raise HTTPException(status_code=400, detail="Cannot snapshot an empty project with no uploaded files.")

        zip_buffer = io.BytesIO()
        bundled_files = []

        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            for item in contents:
                src_key = item["Key"]
                file_name = src_key.replace(prefix, "")
                if not file_name:
                    continue

                # 1. Copy individual file to immutable snapshot folder
                dest_key = f"{snapshot_prefix}{file_name}"
                s3_client.copy_object(
                    Bucket=S3_BUCKET,
                    Key=dest_key,
                    CopySource={"Bucket": S3_BUCKET, "Key": src_key}
                )

                # 2. Add to Zip file
                obj_data = s3_client.get_object(Bucket=S3_BUCKET, Key=src_key)
                file_bytes = obj_data["Body"].read()
                zip_file.writestr(file_name, file_bytes)
                bundled_files.append({"fileName": file_name, "sizeBytes": item["Size"]})

        # 3. Upload Zip to S3
        zip_buffer.seek(0)
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=zip_key,
            Body=zip_buffer.getvalue(),
            ContentType="application/zip",
            Metadata={
                "projectid": projectId,
                "snapshot_time": timestamp_slug,
                "createdby": user.email
            }
        )

        # 4. Generate download URL for the snapshot zip (valid for 24 hours)
        download_url = s3_client.generate_presigned_url(
            ClientMethod="get_object",
            Params={
                "Bucket": S3_BUCKET,
                "Key": zip_key,
                "ResponseContentDisposition": f'attachment; filename="final_submission_{projectId}.zip"'
            },
            ExpiresIn=86400
        )

        # 5. Update DynamoDB project status
        projects_tbl.update_item(
            Key={"projectId": projectId},
            UpdateExpression="SET snapshotStatus = :st, snapshotTimestamp = :ts, snapshotZipKey = :zk",
            ExpressionAttributeValues={
                ":st": "SUBMITTED",
                ":ts": timestamp_slug,
                ":zk": zip_key
            }
        )

        # 6. Log SNAPSHOT_CREATED
        log_activity(
            project_id=projectId,
            action="SNAPSHOT_CREATED",
            actor=user.email,
            details=f"Final academic submission snapshot created ({len(bundled_files)} files bundled into {zip_key})"
        )

        return {
            "message": "Final submission snapshot successfully created and locked.",
            "snapshotPrefix": snapshot_prefix,
            "zipKey": zip_key,
            "downloadUrl": download_url,
            "bundledFiles": bundled_files,
            "timestamp": timestamp_slug
        }
    except ClientError as e:
        logger.error(f"Error creating snapshot for project {projectId}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/projects/{projectId}/activities", tags=["Activity"])
def get_project_activities(projectId: str, limit: int = Query(default=30, ge=1, le=100)):
    """
    Retrieve chronological activity logs for the project from CloudForge_ActivityLogs.
    """
    try:
        res = activity_logs_tbl.query(
            KeyConditionExpression="projectId = :pid",
            ExpressionAttributeValues={":pid": projectId},
            ScanIndexForward=False,  # Descending order (newest first)
            Limit=limit
        )
        items = res.get("Items", [])
        return {"activities": decimal_to_native(items)}
    except ClientError as e:
        logger.error(f"Error fetching activities for {projectId}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Mangum Handler for AWS Lambda
# ---------------------------------------------------------------------------
handler = Mangum(app, lifespan="off")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
