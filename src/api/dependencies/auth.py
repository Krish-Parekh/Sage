import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from src.config import settings
from src.models import AuthUser

_JWT_AUDIENCE = "authenticated"

_bearer = HTTPBearer()
_jwks_client = jwt.PyJWKClient(
    f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"
)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> AuthUser:
    try:
        signing_key = _jwks_client.get_signing_key_from_jwt(credentials.credentials)
        claims = jwt.decode(
            credentials.credentials,
            signing_key.key,
            algorithms=["ES256", "RS256"],
            audience=_JWT_AUDIENCE,
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        ) from exc

    metadata = claims.get("user_metadata") or {}
    return AuthUser(
        id=claims["sub"],
        username=metadata.get("username") or claims["sub"],
    )
