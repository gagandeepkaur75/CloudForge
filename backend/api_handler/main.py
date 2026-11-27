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
ALLOWED_ORIGIN = os.environ.get(
    "CLOUDFORGE_ALLOWED_ORIGIN",
    "https://cloud-forge-nine.vercel.app"
)

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
    allow_origins=[ALLOWED_ORIGIN],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
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


def get_current_user(request: Request) -> UserContext:
    """Extract identity only from API Gateway's validated JWT authorizer claims."""
    aws_event = request.scope.get("aws.event", {})
    request_context = aws_event.get("requestContext", {})
    authorizer = request_context.get("authorizer", {})
    claims = authorizer.get("jwt", {}).get("claims") or authorizer.get("claims")
    if not isinstance(claims, dict):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication is required.")

    email = claims.get("email") or claims.get("cognito:username")
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="The authenticated account has no email identity.")

    return UserContext(email=email)


def project_member_role(project: Dict[str, Any], email: str) -> Optional[str]:
    owner_email = project.get("ownerEmail")
    if isinstance(owner_email, str) and owner_email.lower() == email.lower():
        return "Admin"

    for member in project.get("members") or []:
        if isinstance(member, str) and member.lower() == email.lower():
            return "Contributor"
        if isinstance(member, dict):
            member_email = member.get("email")
            if isinstance(member_email, str) and member_email.lower() == email.lower():
                return member.get("role", "Contributor")
    return None


def require_project_access(
    project_id: str,
    user: UserContext,
    allowed_roles: Optional[List[str]] = None
) -> Dict[str, Any]:
    response = projects_tbl.get_item(Key={"projectId": project_id})
    project = response.get("Item")
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    role = project_member_role(project, user.email)
    if role is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not a member of this project.")
    if allowed_roles and role not in allowed_roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Your project role cannot perform this action.")
    return project


def validate_file_name(file_name: str) -> str:
    if (
        file_name in {".", ".."}
        or any(char in file_name for char in ("/", "\\", "\x00", "\r", "\n"))
    ):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File name must be a single path segment.")
    return file_name


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
    except ClientError:
        logger.exception("Failed to write activity log for project %s", project_id)
        raise


# ---------------------------------------------------------------------------
# Request/Response Models
# ---------------------------------------------------------------------------
class ProjectCreateRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=100)
    description: str = Field(..., max_length=500)
    category: Optional[str] = Field(default="General", max_length=100)
    visibility: Optional[str] = Field(default="Team Shared", max_length=50)


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
    expiryMinutes: int = Field(default=60, ge=15, le=10080)  # 15m to 7d
    permission: Optional[str] = Field(default="Download Access", max_length=50)


class ProjectUpdateRequest(BaseModel):
    title: Optional[str] = Field(default=None, min_length=3, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)
    category: Optional[str] = Field(default=None, max_length=100)
    visibility: Optional[str] = Field(default=None, max_length=50)
    status: Optional[str] = Field(default=None, max_length=50)


class MemberRoleUpdateRequest(BaseModel):
    role: str = Field(..., min_length=3, max_length=30)


class FolderCreateRequest(BaseModel):
    folderName: str = Field(..., min_length=1, max_length=80)


class FileRenameRequest(BaseModel):
    newName: str = Field(..., min_length=1, max_length=255)


class SnapshotCreateRequest(BaseModel):
    snapshotName: Optional[str] = Field(default=None, max_length=120)
    description: Optional[str] = Field(default=None, max_length=500)


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
        items = []
        scan_args = {}
        while True:
            response = projects_tbl.scan(**scan_args)
            items.extend(response.get("Items", []))
            last_key = response.get("LastEvaluatedKey")
            if not last_key:
                break
            scan_args["ExclusiveStartKey"] = last_key
        
        user_projects = []
        for p in items:
            p_clean = decimal_to_native(p)
            if project_member_role(p_clean, user.email):
                user_projects.append(p_clean)

        return {"projects": user_projects}
    except ClientError as e:
        logger.error(f"Error fetching projects: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/projects", status_code=status.HTTP_201_CREATED, tags=["Projects"])
def create_project(req: ProjectCreateRequest, user: UserContext = Depends(get_current_user)):
    """
    Create a new project workspace. The creator becomes the owner and Admin.
    """
    project_id = f"proj-{uuid.uuid4().hex[:10]}"
    now_iso = datetime.now(timezone.utc).isoformat()

    item = {
        "projectId": project_id,
        "title": req.title,
        "description": req.description,
        "category": req.category or "General",
        "visibility": req.visibility or "Team Shared",
        "ownerEmail": user.email,
        "members": [{"email": user.email, "role": "Admin"}],
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
        project = require_project_access(projectId, user)
        return decimal_to_native(project)
    except ClientError as e:
        logger.error(f"Error getting project {projectId}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/projects/{projectId}/members", tags=["Projects"])
def invite_member(projectId: str, req: MemberInviteRequest, user: UserContext = Depends(get_current_user)):
    """
    Invite a team member by email. Restricted to project Admins.
    """
    try:
        project = require_project_access(projectId, user, ["Admin"])
        members = project.get("members", [])
        if project_member_role(project, req.email):
            return {"message": f"{req.email} is already a member of this project.", "members": members}

        role = req.role or "Contributor"
        if role not in {"Admin", "Editor", "Viewer", "Contributor"}:
            raise HTTPException(status_code=400, detail="Unsupported project role.")
        member_email = req.email.strip().lower()
        members.append({"email": member_email, "role": role})
        projects_tbl.update_item(
            Key={"projectId": projectId},
            UpdateExpression="SET members = :m",
            ExpressionAttributeValues={":m": members}
        )

        log_activity(
            project_id=projectId,
            action="MEMBER_ADDED",
            actor=user.email,
            details=f"Added {member_email} to the project"
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
    require_project_access(projectId, user, ["Admin", "Editor", "Contributor"])
    validate_file_name(req.fileName)

    s3_key = f"projects/{projectId}/{req.fileName}"
    content_type = req.fileType or "application/octet-stream"
    category = req.category or "General"

    try:
        presigned_url = s3_client.generate_presigned_url(
            ClientMethod="put_object",
            Params={
                "Bucket": S3_BUCKET,
                "Key": s3_key,
                "ContentType": content_type,
                "Metadata": {
                    "uploadedby": user.email,
                    "projectid": projectId,
                    "category": category
                }
            },
            ExpiresIn=300
        )

        return {
            "uploadUrl": presigned_url,
            "s3Key": s3_key,
            "expiresIn": 300,
            "fileName": req.fileName,
            "uploadHeaders": {
                "Content-Type": content_type,
                "x-amz-meta-uploadedby": user.email,
                "x-amz-meta-projectid": projectId,
                "x-amz-meta-category": category
            }
        }
    except ClientError as e:
        logger.error(f"Error creating pre-signed PUT URL: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate upload URL: {str(e)}")


@app.get("/projects/{projectId}/files", tags=["Files"])
def list_project_files(projectId: str, user: UserContext = Depends(get_current_user)):
    """
    List active files and their latest metadata, versions count, and storage sizes.
    """
    require_project_access(projectId, user)
    prefix = f"projects/{projectId}/"
    try:
        # Fetch latest objects from S3
        files_list = []
        paginator = s3_client.get_paginator("list_objects_v2")
        for page in paginator.paginate(Bucket=S3_BUCKET, Prefix=prefix):
            for obj in page.get("Contents", []):
                s3_key = obj["Key"]
                file_name = s3_key[len(prefix):]
                if not file_name or file_name.endswith("/"):
                    continue

                object_metadata = s3_client.head_object(Bucket=S3_BUCKET, Key=s3_key).get("Metadata", {})
                ext = file_name.rsplit(".", 1)[-1].lower() if "." in file_name else ""
                if ext in {"py", "js", "jsx", "ts", "tsx", "html", "css", "java", "cpp", "c", "sh"}:
                    category = "Source Code"
                elif ext in {"csv", "json", "parquet", "xlsx", "xml", "h5", "sql"}:
                    category = "Dataset"
                elif ext in {"pdf", "docx", "doc", "md", "txt", "rtf"}:
                    category = "Report & Docs"
                elif ext in {"pptx", "ppt", "key"}:
                    category = "Presentation"
                else:
                    category = "General"
                category = object_metadata.get("category", category)

                file_id = f"{projectId}/{file_name}"
                version_count = 0
                query_args = {
                    "KeyConditionExpression": "fileId = :fid",
                    "ExpressionAttributeValues": {":fid": file_id},
                    "Select": "COUNT",
                }
                while True:
                    ver_res = file_versions_tbl.query(**query_args)
                    version_count += ver_res.get("Count", 0)
                    last_key = ver_res.get("LastEvaluatedKey")
                    if not last_key:
                        break
                    query_args["ExclusiveStartKey"] = last_key
                files_list.append({
                    "fileId": file_name,
                    "fileName": file_name,
                    "s3Key": s3_key,
                    "sizeBytes": obj["Size"],
                    "lastModified": obj["LastModified"].isoformat(),
                    "category": category,
                    "folder": category,
                    "uploadedBy": object_metadata.get("uploadedby"),
                    "versionCount": version_count or 1,
                    "eTag": obj.get("ETag", "").strip('"')
                })

        return {"files": files_list}
    except ClientError as e:
        logger.error(f"Error listing files for project {projectId}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/projects/{projectId}/files/{fileName}", tags=["Files"])
def delete_project_file(projectId: str, fileName: str, user: UserContext = Depends(get_current_user)):
    require_project_access(projectId, user, ["Admin", "Editor", "Contributor"])
    if "/" in fileName or "\\" in fileName or fileName in {".", ".."}:
        raise HTTPException(status_code=400, detail="File name must be a single path segment.")

    s3_key = f"projects/{projectId}/{fileName}"
    try:
        s3_client.delete_object(Bucket=S3_BUCKET, Key=s3_key)
        log_activity(
            project_id=projectId,
            action="FILE_DELETED",
            actor=user.email,
            details=f"Deleted '{fileName}' from the project."
        )
        return {"message": f"Deleted '{fileName}'.", "fileName": fileName}
    except ClientError as e:
        logger.error(f"Error deleting file {fileName}: {e}")
        raise HTTPException(status_code=500, detail="File deletion failed.")


@app.get("/projects/{projectId}/files/{fileName}/versions", tags=["Files"])
def get_file_versions(projectId: str, fileName: str, user: UserContext = Depends(get_current_user)):
    """
    Fetch all historical S3 versions for a given file.
    Combines DynamoDB metadata with S3 version metadata.
    """
    require_project_access(projectId, user)
    validate_file_name(fileName)
    s3_key = f"projects/{projectId}/{fileName}"
    file_id = f"{projectId}/{fileName}"

    try:
        # Check S3 list_object_versions
        s3_paginator = s3_client.get_paginator("list_object_versions")
        raw_versions = []
        for page in s3_paginator.paginate(Bucket=S3_BUCKET, Prefix=s3_key):
            raw_versions.extend(page.get("Versions", []))

        # Also query DynamoDB CloudForge_FileVersions for rich metadata
        db_versions = {}
        try:
            query_args = {
                "KeyConditionExpression": "fileId = :fid",
                "ExpressionAttributeValues": {":fid": file_id}
            }
            while True:
                ver_res = file_versions_tbl.query(**query_args)
                for v in ver_res.get("Items", []):
                    db_versions[v.get("versionId")] = decimal_to_native(v)
                last_key = ver_res.get("LastEvaluatedKey")
                if not last_key:
                    break
                query_args["ExclusiveStartKey"] = last_key
        except ClientError:
            logger.exception("Could not query version metadata for %s", file_id)
            raise

        versions = []
        for ver in raw_versions:
            if ver["Key"] != s3_key:
                continue
            ver_id = ver["VersionId"]
            db_meta = db_versions.get(ver_id, {})

            versions.append({
                "versionId": ver_id,
                "isLatest": ver.get("IsLatest", False),
                "lastModified": ver["LastModified"].isoformat(),
                "sizeBytes": ver["Size"],
                "uploadedBy": db_meta.get("uploadedBy", "Unknown"),
                "uploadedAt": db_meta.get("uploadedAt", ver["LastModified"].isoformat()),
                "label": f"v{len(versions) + 1}"
            })

        return {"fileName": fileName, "versions": versions}
    except ClientError as e:
        logger.error(f"Error fetching versions for {fileName}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/projects/{projectId}/files/{fileName}/download", tags=["Files"])
def get_file_download_url(
    projectId: str,
    fileName: str,
    user: UserContext = Depends(get_current_user)
):
    require_project_access(projectId, user)
    validate_file_name(fileName)
    s3_key = f"projects/{projectId}/{fileName}"
    try:
        download_url = s3_client.generate_presigned_url(
            ClientMethod="get_object",
            Params={
                "Bucket": S3_BUCKET,
                "Key": s3_key,
                "ResponseContentDisposition": f'attachment; filename="{fileName}"'
            },
            ExpiresIn=300
        )
        return {"downloadUrl": download_url, "expiresIn": 300, "fileName": fileName}
    except ClientError as error:
        logger.error("Error generating download URL for %s: %s", fileName, error)
        raise HTTPException(status_code=500, detail="Unable to generate a download URL.")


@app.get("/projects/{projectId}/files/{fileName}/versions/download", tags=["Files"])
def get_version_download_url(
    projectId: str,
    fileName: str,
    versionId: str,
    user: UserContext = Depends(get_current_user)
):
    require_project_access(projectId, user)
    validate_file_name(fileName)
    s3_key = f"projects/{projectId}/{fileName}"
    try:
        download_url = s3_client.generate_presigned_url(
            ClientMethod="get_object",
            Params={
                "Bucket": S3_BUCKET,
                "Key": s3_key,
                "VersionId": versionId,
                "ResponseContentDisposition": f'attachment; filename="{fileName}"'
            },
            ExpiresIn=300
        )
        return {"downloadUrl": download_url, "expiresIn": 300, "fileName": fileName, "versionId": versionId}
    except ClientError as error:
        logger.error("Error generating download URL for %s version %s: %s", fileName, versionId, error)
        raise HTTPException(status_code=500, detail="Unable to generate a version download URL.")


@app.post("/projects/{projectId}/files/{fileName}/recover", tags=["Files"])
def recover_file_version(projectId: str, fileName: str, req: VersionRecoverRequest, user: UserContext = Depends(get_current_user)):
    """
    Restore a specific S3 versionId by copying that historical object version
    onto the current key (s3.copy_object with VersionId).
    Logs VERSION_RECOVERED in CloudForge_ActivityLogs.
    """
    require_project_access(projectId, user, ["Admin", "Editor"])
    validate_file_name(fileName)
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
    Configurable expiry (15m, 1h, 24h, 7d).
    Logs LINK_SHARED in CloudForge_ActivityLogs and stores link metadata on the project.
    """
    project = require_project_access(projectId, user, ["Admin", "Editor", "Contributor"])
    validate_file_name(fileName)
    s3_key = f"projects/{projectId}/{fileName}"
    expires_in_secs = req.expiryMinutes * 60
    permission = req.permission or "Download Access"
    disposition = "inline" if permission == "View Only" else f'attachment; filename="{fileName}"'

    try:
        presigned_url = s3_client.generate_presigned_url(
            ClientMethod="get_object",
            Params={
                "Bucket": S3_BUCKET,
                "Key": s3_key,
                "ResponseContentDisposition": disposition
            },
            ExpiresIn=expires_in_secs
        )

        now_iso = datetime.now(timezone.utc).isoformat()
        expires_at = datetime.fromtimestamp(time.time() + expires_in_secs, timezone.utc).isoformat()
        link_id = f"link-{uuid.uuid4().hex[:10]}"
        link_record = {
            "linkId": link_id,
            "id": link_id,
            "projectId": projectId,
            "projectName": project.get("title", projectId),
            "fileName": fileName,
            "sharedBy": user.email,
            "permission": permission,
            "createdDate": now_iso,
            "expirationDate": expires_at,
            "expiresAt": expires_at,
            "status": "Active",
            "shareUrl": presigned_url,
            "url": presigned_url,
        }

        projects_tbl.update_item(
            Key={"projectId": projectId},
            UpdateExpression="SET sharedLinks = list_append(if_not_exists(sharedLinks, :empty), :link)",
            ExpressionAttributeValues={
                ":empty": [],
                ":link": [link_record]
            }
        )

        # Log sharing activity
        log_activity(
            project_id=projectId,
            action="LINK_SHARED",
            actor=user.email,
            details=f"Shared temporary link for '{fileName}' valid for {req.expiryMinutes} minutes"
        )

        return {
            **link_record,
            "expiresInMinutes": req.expiryMinutes,
        }
    except ClientError as e:
        logger.error(f"Error generating share URL for {fileName}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/projects/{projectId}/snapshot", tags=["Snapshots"])
def create_final_submission_snapshot(
    projectId: str,
    req: SnapshotCreateRequest,
    user: UserContext = Depends(get_current_user)
):
    """
    Create a point-in-time final submission snapshot:
    1. Copies all current project files into s3://{bucket}/snapshots/{projectId}/{timestamp}/
    2. Builds an in-memory .zip package containing all files and uploads to S3
    3. Updates snapshotStatus="SUBMITTED" in CloudForge_Projects
    4. Logs SNAPSHOT_CREATED in CloudForge_ActivityLogs
    """
    project = require_project_access(projectId, user, ["Admin"])
    prefix = f"projects/{projectId}/"
    timestamp_slug = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S_%f")
    snapshot_prefix = f"snapshots/{projectId}/{timestamp_slug}/"
    zip_key = f"{snapshot_prefix}final_submission_{projectId}_{timestamp_slug}.zip"

    try:
        # List all current files
        list_paginator = s3_client.get_paginator("list_objects_v2")
        contents = [
            item
            for page in list_paginator.paginate(Bucket=S3_BUCKET, Prefix=prefix)
            for item in page.get("Contents", [])
        ]

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

                # 1. Copy individual file to the timestamped snapshot folder
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

        snapshot = {
            "snapshotId": timestamp_slug,
            "snapshotName": req.snapshotName or f"Submission {timestamp_slug}",
            "description": req.description or "",
            "projectId": projectId,
            "projectName": project.get("title", projectId),
            "createdBy": user.email,
            "createdDate": datetime.now(timezone.utc).isoformat(),
            "fileCount": len(bundled_files),
            "status": "Created",
            "snapshotPrefix": snapshot_prefix,
            "zipKey": zip_key
        }
        snapshot["downloadUrl"] = download_url

        # 5. Update DynamoDB project status and retain snapshot metadata.
        projects_tbl.update_item(
            Key={"projectId": projectId},
            UpdateExpression="SET snapshotStatus = :st, snapshotTimestamp = :ts, snapshotZipKey = :zk, snapshots = list_append(if_not_exists(snapshots, :empty), :snapshot)",
            ExpressionAttributeValues={
                ":st": "SUBMITTED",
                ":ts": timestamp_slug,
                ":zk": zip_key,
                ":empty": [],
                ":snapshot": [snapshot]
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
            "message": "Final submission snapshot created.",
            "snapshot": snapshot,
            "snapshotPrefix": snapshot_prefix,
            "zipKey": zip_key,
            "downloadUrl": download_url,
            "bundledFiles": bundled_files,
            "timestamp": timestamp_slug
        }
    except ClientError as e:
        logger.error(f"Error creating snapshot for project {projectId}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/projects/{projectId}/snapshots", tags=["Snapshots"])
def list_project_snapshots(projectId: str, user: UserContext = Depends(get_current_user)):
    project = require_project_access(projectId, user)
    snapshots = []
    for snapshot in project.get("snapshots", []):
        snapshot_data = decimal_to_native(snapshot)
        snapshot_data["downloadUrl"] = s3_client.generate_presigned_url(
            ClientMethod="get_object",
            Params={
                "Bucket": S3_BUCKET,
                "Key": snapshot_data["zipKey"],
                "ResponseContentDisposition": f'attachment; filename="{snapshot_data["zipKey"].split("/")[-1]}"'
            },
            ExpiresIn=3600
        )
        snapshots.append(snapshot_data)
    return {"snapshots": snapshots}


@app.get("/projects/{projectId}/activities", tags=["Activity"])
def get_project_activities(
    projectId: str,
    limit: int = Query(default=30, ge=1, le=100),
    user: UserContext = Depends(get_current_user)
):
    """
    Retrieve chronological activity logs for the project from CloudForge_ActivityLogs.
    """
    require_project_access(projectId, user)
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


@app.put("/projects/{projectId}", tags=["Projects"])
def update_project(projectId: str, req: ProjectUpdateRequest, user: UserContext = Depends(get_current_user)):
    project = require_project_access(projectId, user, ["Admin"])
    now_iso = datetime.now(timezone.utc).isoformat()
    updates = {"lastModified": now_iso}
    for field in ("title", "description", "category", "visibility", "status"):
        val = getattr(req, field)
        if val is not None:
            updates[field] = val.strip() if isinstance(val, str) else val

    expr_parts = []
    expr_names = {}
    expr_vals = {}
    for idx, (k, v) in enumerate(updates.items()):
        nk, vk = f"#k{idx}", f":v{idx}"
        expr_names[nk] = k
        expr_vals[vk] = v
        expr_parts.append(f"{nk} = {vk}")

    try:
        projects_tbl.update_item(
            Key={"projectId": projectId},
            UpdateExpression="SET " + ", ".join(expr_parts),
            ExpressionAttributeNames=expr_names,
            ExpressionAttributeValues=expr_vals
        )
        project.update(updates)
        log_activity(projectId, "PROJECT_UPDATED", user.email, f"Updated project '{project.get('title', projectId)}'")
        return decimal_to_native(project)
    except ClientError as e:
        logger.error("Error updating project %s: %s", projectId, e)
        raise HTTPException(status_code=500, detail="Failed to update project.")


@app.delete("/projects/{projectId}", tags=["Projects"])
def delete_project(projectId: str, user: UserContext = Depends(get_current_user)):
    require_project_access(projectId, user, ["Admin"])
    try:
        prefix = f"projects/{projectId}/"
        paginator = s3_client.get_paginator("list_objects_v2")
        for page in paginator.paginate(Bucket=S3_BUCKET, Prefix=prefix):
            objs = [{"Key": o["Key"]} for o in page.get("Contents", [])]
            if objs:
                s3_client.delete_objects(Bucket=S3_BUCKET, Delete={"Objects": objs})
        projects_tbl.delete_item(Key={"projectId": projectId})
        return {"success": True, "projectId": projectId}
    except ClientError as e:
        logger.error("Error deleting project %s: %s", projectId, e)
        raise HTTPException(status_code=500, detail="Failed to delete project.")


@app.put("/projects/{projectId}/members/{memberEmail}", tags=["Projects"])
def update_member_role(
    projectId: str,
    memberEmail: str,
    req: MemberRoleUpdateRequest,
    user: UserContext = Depends(get_current_user)
):
    project = require_project_access(projectId, user, ["Admin"])
    target_email = memberEmail.strip().lower()
    if req.role not in {"Admin", "Editor", "Viewer", "Contributor"}:
        raise HTTPException(status_code=400, detail="Unsupported project role.")
    if target_email == (project.get("ownerEmail") or "").lower():
        raise HTTPException(status_code=400, detail="Cannot change the role of the project owner.")

    members = list(project.get("members") or [])
    updated = []
    found = False
    for m in members:
        if isinstance(m, str):
            if m.lower() == target_email:
                updated.append({"email": target_email, "role": req.role})
                found = True
            else:
                updated.append({"email": m, "role": "Contributor"})
        elif isinstance(m, dict):
            if (m.get("email") or "").lower() == target_email:
                m = {**m, "role": req.role}
                found = True
            updated.append(m)

    if not found:
        raise HTTPException(status_code=404, detail="Member not found in project.")

    projects_tbl.update_item(
        Key={"projectId": projectId},
        UpdateExpression="SET members = :m",
        ExpressionAttributeValues={":m": updated}
    )
    log_activity(projectId, "PERMISSION_CHANGED", user.email, f"Updated {target_email} role to {req.role}")
    return {"success": True, "members": updated}


@app.delete("/projects/{projectId}/members/{memberEmail}", tags=["Projects"])
def remove_member(projectId: str, memberEmail: str, user: UserContext = Depends(get_current_user)):
    project = require_project_access(projectId, user, ["Admin"])
    target_email = memberEmail.strip().lower()
    if target_email == (project.get("ownerEmail") or "").lower():
        raise HTTPException(status_code=400, detail="Cannot remove the project owner.")

    members = [
        m for m in (project.get("members") or [])
        if (m.lower() if isinstance(m, str) else (m.get("email") or "").lower()) != target_email
    ]
    projects_tbl.update_item(
        Key={"projectId": projectId},
        UpdateExpression="SET members = :m",
        ExpressionAttributeValues={":m": members}
    )
    log_activity(projectId, "MEMBER_REMOVED", user.email, f"Removed {target_email} from project")
    return {"success": True, "members": members}


@app.get("/projects/{projectId}/folders", tags=["Folders"])
def get_project_folders(projectId: str, user: UserContext = Depends(get_current_user)):
    project = require_project_access(projectId, user)
    folders = project.get("folders") or ["Source Code", "Datasets", "Reports", "Documentation", "Presentations"]
    return {"folders": folders}


@app.post("/projects/{projectId}/folders", tags=["Folders"])
def create_project_folder(projectId: str, req: FolderCreateRequest, user: UserContext = Depends(get_current_user)):
    project = require_project_access(projectId, user, ["Admin", "Editor", "Contributor"])
    folder_name = req.folderName.strip()
    folders = list(project.get("folders") or ["Source Code", "Datasets", "Reports", "Documentation", "Presentations"])
    if folder_name not in folders:
        folders.append(folder_name)
        projects_tbl.update_item(
            Key={"projectId": projectId},
            UpdateExpression="SET folders = :f",
            ExpressionAttributeValues={":f": folders}
        )
    return {"folders": folders}


@app.delete("/projects/{projectId}/folders/{folderName}", tags=["Folders"])
def delete_project_folder(projectId: str, folderName: str, user: UserContext = Depends(get_current_user)):
    project = require_project_access(projectId, user, ["Admin", "Editor", "Contributor"])
    folders = [f for f in (project.get("folders") or []) if f != folderName]
    projects_tbl.update_item(
        Key={"projectId": projectId},
        UpdateExpression="SET folders = :f",
        ExpressionAttributeValues={":f": folders}
    )
    return {"success": True, "folders": folders}


@app.put("/projects/{projectId}/files/{fileName}/rename", tags=["Files"])
def rename_project_file(
    projectId: str,
    fileName: str,
    req: FileRenameRequest,
    user: UserContext = Depends(get_current_user)
):
    require_project_access(projectId, user, ["Admin", "Editor", "Contributor"])
    validate_file_name(fileName)
    validate_file_name(req.newName)
    if fileName == req.newName:
        return {"success": True, "fileName": req.newName}

    old_key = f"projects/{projectId}/{fileName}"
    new_key = f"projects/{projectId}/{req.newName}"
    try:
        s3_client.copy_object(
            Bucket=S3_BUCKET,
            Key=new_key,
            CopySource={"Bucket": S3_BUCKET, "Key": old_key},
            MetadataDirective="COPY"
        )
        s3_client.delete_object(Bucket=S3_BUCKET, Key=old_key)
        log_activity(projectId, "FILE_UPDATED", user.email, f"Renamed '{fileName}' to '{req.newName}'")
        return {"success": True, "fileName": req.newName}
    except ClientError as e:
        logger.error("Error renaming file %s: %s", fileName, e)
        raise HTTPException(status_code=500, detail="File rename failed.")


@app.get("/shares", tags=["Sharing"])
def list_shared_links(user: UserContext = Depends(get_current_user)):
    projects = list_projects(user).get("projects", [])
    now_iso = datetime.now(timezone.utc).isoformat()
    all_links = []
    for proj in projects:
        for link in proj.get("sharedLinks", []):
            item = decimal_to_native(link)
            exp = item.get("expiresAt") or item.get("expirationDate") or ""
            if item.get("status") == "Active" and exp and exp < now_iso:
                item["status"] = "Expired"
            all_links.append(item)
    all_links.sort(key=lambda x: x.get("createdDate") or "", reverse=True)
    return {"sharedLinks": all_links}


@app.delete("/shares/{linkId}", tags=["Sharing"])
def revoke_shared_link(linkId: str, user: UserContext = Depends(get_current_user)):
    projects = list_projects(user).get("projects", [])
    for proj in projects:
        links = list(proj.get("sharedLinks") or [])
        for idx, link in enumerate(links):
            if (link.get("linkId") or link.get("id")) == linkId:
                require_project_access(proj["projectId"], user, ["Admin", "Editor", "Contributor"])
                links[idx] = {**link, "status": "Revoked"}
                projects_tbl.update_item(
                    Key={"projectId": proj["projectId"]},
                    UpdateExpression="SET sharedLinks = :sl",
                    ExpressionAttributeValues={":sl": links}
                )
                log_activity(proj["projectId"], "LINK_REVOKED", user.email, f"Revoked share link for '{link.get('fileName')}'")
                return {"success": True, "linkId": linkId}
    raise HTTPException(status_code=404, detail="Share link not found.")


# ---------------------------------------------------------------------------
# Mangum Handler for AWS Lambda
# ---------------------------------------------------------------------------
handler = Mangum(app, lifespan="off")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
