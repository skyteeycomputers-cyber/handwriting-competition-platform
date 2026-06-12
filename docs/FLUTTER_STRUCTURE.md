# Flutter Project Structure
# Global Handwriting Competition Platform

## Project Folder Organization

```
handwriting_competition_platform/
├── android/                          # Android native code
├── ios/                              # iOS native code
├── web/                              # Web configuration
├── lib/
│   ├── main.dart                     # Application entry point
│   ├── config/
│   │   ├── app_config.dart          # App configuration
│   │   ├── constants.dart            # Constants and theme
│   │   ├── routes.dart               # Route definitions
│   │   └── di_container.dart         # Dependency injection
│   │
│   ├── core/
│   │   ├── error/
│   │   │   ├── exceptions.dart       # Custom exceptions
│   │   │   └── failures.dart         # Failure models
│   │   ├── usecase/
│   │   │   └── usecase.dart          # Base usecase
│   │   ├── utils/
│   │   │   ├── validators.dart       # Input validators
│   │   │   ├── extensions.dart       # Dart extensions
│   │   │   ├── logger.dart           # Logging utility
│   │   │   └── cache_utils.dart      # Cache utilities
│   │   └── network/
│   │       ├── api_client.dart       # HTTP client wrapper
│   │       ├── interceptors/
│   │       │   ├── auth_interceptor.dart
│   │       │   ├── logging_interceptor.dart
│   │       │   └��─ error_interceptor.dart
│   │       └── network_info.dart     # Network connectivity check
│   │
│   ├── data/
│   │   ├── datasources/
│   │   │   ├── local/
│   │   │   │   ├── hive_box_names.dart
│   │   │   │   ├── auth_local_datasource.dart
│   │   │   │   ├── user_local_datasource.dart
│   │   │   │   └── cache_local_datasource.dart
│   │   │   └── remote/
│   │   │       ├── auth_remote_datasource.dart
│   │   │       ├── user_remote_datasource.dart
│   │   │       ├── competition_remote_datasource.dart
│   │   │       ├── submission_remote_datasource.dart
│   │   │       ├── payment_remote_datasource.dart
│   │   │       ├── wallet_remote_datasource.dart
│   │   │       ├── enrollment_remote_datasource.dart
│   │   │       ├── learning_remote_datasource.dart
│   │   │       └── notification_remote_datasource.dart
│   │   │
│   │   ├── models/
│   │   │   ├── auth/
│   │   │   │   ├── login_model.dart
│   │   │   │   ├── register_model.dart
│   │   │   │   └── token_model.dart
│   │   │   ├── user/
│   │   │   │   ├── user_model.dart
│   │   │   │   └── profile_model.dart
│   │   │   ├── competition/
│   │   │   │   ├── competition_model.dart
│   │   │   │   └── enrollment_model.dart
│   │   │   ├── submission/
│   │   │   │   ├── submission_model.dart
│   │   │   │   ├── ai_grade_model.dart
│   │   │   │   └── human_grade_model.dart
│   │   │   ├── payment/
│   │   │   │   ├── payment_model.dart
│   │   │   │   └── transaction_model.dart
│   │   │   ├── wallet/
│   │   │   │   └── wallet_model.dart
│   │   │   ├── learning/
│   │   │   │   ├── course_model.dart
│   │   │   │   └── lesson_model.dart
│   │   │   └── notification/
│   │   │       └── notification_model.dart
│   │   │
│   │   └── repositories/
│   │       ├── auth_repository_impl.dart
│   │       ├── user_repository_impl.dart
│   │       ├── competition_repository_impl.dart
│   │       ├── submission_repository_impl.dart
│   │       ├── payment_repository_impl.dart
│   │       ├── wallet_repository_impl.dart
│   │       ├── enrollment_repository_impl.dart
│   │       ├── learning_repository_impl.dart
│   │       └── notification_repository_impl.dart
│   │
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── auth/
│   │   │   │   ├── user_entity.dart
│   │   │   │   └── token_entity.dart
│   │   │   ├── competition/
│   │   │   │   ├── competition_entity.dart
│   │   │   │   └── enrollment_entity.dart
│   │   │   ├── submission/
│   │   │   │   ├── submission_entity.dart
│   │   │   │   ├── ai_grade_entity.dart
│   │   │   │   └── human_grade_entity.dart
│   │   │   ├── payment/
│   │   │   │   └── payment_entity.dart
│   │   │   ├── wallet/
│   │   │   │   └── wallet_entity.dart
│   │   │   ├── learning/
│   │   │   │   ├── course_entity.dart
│   │   │   │   └── lesson_entity.dart
│   │   │   └── notification/
│   │   │       └── notification_entity.dart
│   │   │
│   │   └── repositories/
│   │       ├── auth_repository.dart
│   │       ├── user_repository.dart
│   │       ├── competition_repository.dart
│   │       ├── submission_repository.dart
│   │       ├── payment_repository.dart
│   │       ├── wallet_repository.dart
│   │       ├── enrollment_repository.dart
│   │       ├── learning_repository.dart
│   │       └── notification_repository.dart
│   │
│   ├── presentation/
│   │   ├── bloc/                    # BLoC state management
│   │   │   ├── auth/
│   │   │   │   ├── auth_bloc.dart
│   │   │   │   ├── auth_event.dart
│   │   │   │   └── auth_state.dart
│   │   │   ├── user/
│   │   │   │   ├── user_bloc.dart
│   │   │   │   ├── user_event.dart
│   │   │   │   └── user_state.dart
│   │   │   ├── competition/
│   │   │   │   ├── competition_bloc.dart
│   │   │   │   ├── competition_event.dart
│   │   │   │   └── competition_state.dart
│   │   │   ├── submission/
│   │   │   │   ├── submission_bloc.dart
│   │   │   │   ├── submission_event.dart
│   │   │   │   └── submission_state.dart
│   │   │   ├── payment/
│   │   │   │   ├── payment_bloc.dart
│   │   │   │   ├── payment_event.dart
│   │   │   │   └── payment_state.dart
│   │   │   ├── wallet/
│   │   │   │   ├── wallet_bloc.dart
│   │   │   │   ├── wallet_event.dart
│   │   │   │   └── wallet_state.dart
│   │   │   ├── enrollment/
│   │   │   │   ├── enrollment_bloc.dart
│   │   │   │   ├── enrollment_event.dart
│   │   │   │   └── enrollment_state.dart
│   │   │   ├── learning/
│   │   │   │   ├── learning_bloc.dart
│   │   │   │   ├── learning_event.dart
│   │   │   │   └── learning_state.dart
│   │   │   └── notification/
│   │   │       ├── notification_bloc.dart
│   │   │       ├── notification_event.dart
│   │   │       └── notification_state.dart
│   │   │
│   │   ├── pages/
│   │   │   ├── splash/
│   │   │   │   ├── splash_page.dart
│   │   │   │   └── widgets/
│   │   │   ├── auth/
│   │   │   │   ├── login_page.dart
│   │   │   │   ├── register_page.dart
│   │   │   │   ├── forgot_password_page.dart
│   │   │   │   └── widgets/
│   │   │   ├── home/
│   │   │   │   ├── home_page.dart
│   │   │   │   └── widgets/
│   │   │   ├── competitions/
│   │   │   │   ├── competitions_list_page.dart
│   │   │   │   ├── competition_detail_page.dart
│   │   │   │   └── widgets/
│   │   │   ├── enrollment/
│   │   │   │   ├── enrollment_page.dart
│   │   │   │   ├── facial_verification_page.dart
│   │   │   │   └── widgets/
│   │   │   ├── submission/
│   │   │   │   ├── submission_page.dart
│   │   │   │   ├── upload_page.dart
│   │   │   │   └── widgets/
│   │   │   ├── results/
│   │   │   │   ├── results_page.dart
│   │   │   │   ├── grade_details_page.dart
│   │   │   │   └── widgets/
│   │   │   ├── wallet/
│   │   │   │   ├── wallet_page.dart
│   │   │   │   ├── withdrawal_page.dart
│   │   │   │   ├── transaction_history_page.dart
│   │   │   │   └── widgets/
│   │   │   ├── learning/
│   │   │   │   ├── courses_page.dart
│   │   │   │   ├── course_detail_page.dart
│   │   │   │   ├── lesson_page.dart
│   │   │   │   ├── assignment_page.dart
│   │   │   │   └── widgets/
│   │   │   ├── leaderboard/
│   │   │   │   ├── leaderboard_page.dart
│   │   │   │   └── widgets/
│   │   │   ├── profile/
│   │   │   │   ├── profile_page.dart
│   │   │   │   ├── edit_profile_page.dart
│   │   │   │   ├── settings_page.dart
│   │   │   │   └── widgets/
│   │   │   ├── notifications/
│   │   │   │   ├── notifications_page.dart
│   │   │   │   └── widgets/
│   │   │   └── admin/
│   │   │       ├── admin_dashboard_page.dart
│   │   │       ├── user_management_page.dart
│   │   │       ├── competition_management_page.dart
│   │   │       ├── analytics_page.dart
│   │   │       └── widgets/
│   │   │
│   │   ├── widgets/
│   │   │   ├── common/
│   │   │   │   ├── app_button.dart
│   │   │   │   ├── app_text_field.dart
│   │   │   │   ├── app_loader.dart
│   │   │   │   ├── app_snackbar.dart
│   │   │   │   ├── app_dialog.dart
│   │   │   │   ├── app_card.dart
│   │   │   │   └── app_app_bar.dart
│   │   │   └── custom/
│   │   │       ├── handwriting_canvas.dart
│   │   │       ├── signature_pad.dart
│   │   │       ├── image_viewer.dart
│   │   │       ├── camera_widget.dart
│   │   │       └── pdf_viewer.dart
│   │   │
│   │   └── theme/
│   │       ├── app_theme.dart
│   │       ├── app_colors.dart
│   │       ├── app_text_styles.dart
│   │       ├── app_dimensions.dart
│   │       └── app_decoration.dart
│   │
│   └── services/
│       ├── auth_service.dart
│       ├── storage_service.dart
│       ├── notification_service.dart
│       ├── analytics_service.dart
│       ├── camera_service.dart
│       ├── file_service.dart
│       ├── payment_service.dart
│       ├── local_notification_service.dart
│       └── fcm_service.dart
│
├── test/
│   ├── unit/
│   │   ├── bloc/
│   │   ├── repository/
│   │   └── usecase/
│   └── integration/
│       └── app_test.dart
│
├── pubspec.yaml                      # Dependencies
├── analysis_options.yaml              # Linter rules
├── README.md                          # Project documentation
└── .env                               # Environment variables
```

## Key Dependencies

```yaml
dependencies:
  # State Management
  flutter_bloc: ^8.1.0
  bloc: ^8.1.0
  
  # API & Networking
  dio: ^5.1.0
  retrofit: ^4.0.0
  
  # Local Storage
  hive: ^2.2.0
  hive_flutter: ^1.1.0
  shared_preferences: ^2.0.0
  
  # Device & Camera
  image_picker: ^0.8.6
  camera: ^0.10.0
  permission_handler: ^11.4.0
  
  # UI & Navigation
  go_router: ^10.0.0
  flutter_screenutil: ^5.9.0
  cached_network_image: ^3.3.0
  
  # Utilities
  intl: ^0.18.0
  uuid: ^3.0.0
  get_it: ^7.5.0
  logger: ^1.4.0
  
  # Payment
  stripe_flutter: ^10.0.0
  paypal_flutter_sdk: ^0.2.0
  
  # Firebase & Push Notifications
  firebase_core: ^2.14.0
  firebase_messaging: ^14.6.0
  flutter_local_notifications: ^15.0.0
  
  # PDF & Document Viewing
  pdf: ^3.10.0
  pdfx: ^2.5.0
  
  # Video Playback
  video_player: ^2.7.0
  chewie: ^1.7.0
  
  # Date & Time
  table_calendar: ^3.0.0
  
  # Environment
  flutter_dotenv: ^5.1.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0
  mockito: ^5.4.0
  build_runner: ^2.4.0
```

## Clean Architecture Layers

### 1. Presentation Layer
- Pages (UI Screens)
- BLoCs (State Management)
- Widgets (Reusable Components)
- Theme (Styling)

### 2. Domain Layer
- Entities (Business Logic Models)
- Repositories (Abstract Interfaces)
- Use Cases (Business Logic Operations)

### 3. Data Layer
- Repositories Implementation
- Models (API Responses)
- Data Sources (Remote API & Local Storage)

## State Management Pattern (BLoC)

Each feature follows:
- `XyzBloc` - Main business logic
- `XyzEvent` - User interactions
- `XyzState` - UI state representation

Example: `AuthBloc`, `AuthEvent`, `AuthState`

## Code Generation

Use build_runner for:
```bash
flutter pub run build_runner build
```

- Retrofit API client generation
- JSON serialization
- Hive type adapters

## Testing Structure

- Unit Tests: Core logic, repositories
- Widget Tests: UI components
- Integration Tests: Full app flows

---

**Document Version:** 1.0  
**Last Updated:** 2026-06-12  
**Status:** Active
