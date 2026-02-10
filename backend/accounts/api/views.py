"""API views for accounts app."""

from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.api.serializers.input import (
    GoogleLoginSerializer,
    LoginSerializer,
    RegisterSerializer,
)
from accounts.api.serializers.output import TokenSerializer, UserSerializer
from accounts.services.auth_service import (
    google_login,
    login_user,
    register_user,
)


class RegisterView(APIView):
    """Register a new user with email and password."""

    permission_classes = [AllowAny]

    @extend_schema(
        summary="Register",
        description="Register a new user with email and password.",
        request=RegisterSerializer,
        responses={201: TokenSerializer},
    )
    def post(self, request: Request) -> Response:
        """Handle user registration.

        Args:
            request: DRF Request with registration data.

        Returns:
            Response with JWT tokens and user data.
        """
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = register_user(
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
            first_name=serializer.validated_data.get("first_name", ""),
            last_name=serializer.validated_data.get("last_name", ""),
        )
        return Response(
            {
                "access": result["tokens"]["access"],
                "refresh": result["tokens"]["refresh"],
                "user": UserSerializer(result["user"]).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """Authenticate a user with email and password."""

    permission_classes = [AllowAny]

    @extend_schema(
        summary="Login",
        description="Login with email and password.",
        request=LoginSerializer,
        responses={200: TokenSerializer},
    )
    def post(self, request: Request) -> Response:
        """Handle user login.

        Args:
            request: DRF Request with login credentials.

        Returns:
            Response with JWT tokens and user data.
        """
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = login_user(
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )
        if result is None:
            return Response(
                {"detail": "Email yoki parol noto'g'ri."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        return Response(
            {
                "access": result["tokens"]["access"],
                "refresh": result["tokens"]["refresh"],
                "user": UserSerializer(result["user"]).data,
            },
            status=status.HTTP_200_OK,
        )


class GoogleLoginView(APIView):
    """Authenticate a user with a Google ID token."""

    permission_classes = [AllowAny]

    @extend_schema(
        summary="Google Login",
        description="Login or register with a Google ID token.",
        request=GoogleLoginSerializer,
        responses={200: TokenSerializer},
    )
    def post(self, request: Request) -> Response:
        """Handle Google OAuth login.

        Args:
            request: DRF Request containing id_token.

        Returns:
            Response with JWT tokens and user data.
        """
        serializer = GoogleLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = google_login(
            token=serializer.validated_data["id_token"],
        )
        if result is None:
            return Response(
                {"detail": "Google autentifikatsiya muvaffaqiyatsiz."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        return Response(
            {
                "access": result["tokens"]["access"],
                "refresh": result["tokens"]["refresh"],
                "user": UserSerializer(result["user"]).data,
            },
            status=status.HTTP_200_OK,
        )


class MeView(APIView):
    """Retrieve the currently authenticated user."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Current user",
        description="Get the currently authenticated user.",
        responses={200: UserSerializer},
    )
    def get(self, request: Request) -> Response:
        """Return the authenticated user's profile.

        Args:
            request: Authenticated DRF Request.

        Returns:
            Response with user data.
        """
        return Response(
            UserSerializer(request.user).data,
            status=status.HTTP_200_OK,
        )
