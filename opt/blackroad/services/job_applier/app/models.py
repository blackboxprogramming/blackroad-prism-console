from pydantic import BaseModel, HttpUrl, Field
from typing import List, Optional, Dict

class Profile(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    extras: Dict[str, str] = {}

class ApplyRequest(BaseModel):
    job_urls: List[HttpUrl] = Field(default_factory=list, description="Company job posting URLs")
    resume_text: Optional[str] = None
    cover_template: Optional[str] = None
    profile: Optional[Profile] = None
    dry_run: Optional[bool] = None  # override container default
