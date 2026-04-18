# FE TypeScript Contract Freeze (BE Parity)

## 1) Baseline Checklist (manual regression)
- Role `system_admin`: `/admin/workshop-kpi-view`, `/admin/monthly-scores-view`, `/admin/bonus-configs`, `/admin/workshop-kpis`, `/admin/penalty-rules`, `/admin/employee`, `/admin/branches`, `/admin/notifications`.
- Role `workshop_manager`: `/branch/data-entry`, `/branch/monthly-scores`, `/branch/kpi-view`.
- Role `employee`: `/me/kpis`.
- All role flows keep same route guard + redirect behavior as before migration.

## 2) FE-BE Contract Map (frozen)
- `authService`
  - `POST /auth/login`
  - `PATCH /auth/change-password`
- `userService`
  - `GET /users`
  - `POST /users`
  - `PATCH /users/:id`
  - `PATCH /users/:id/deactivate`
- `workshopKpiService`
  - `GET/POST/PATCH/DELETE /phan-xuong`
  - `GET /bsc-categories`
  - `GET/POST/PATCH/DELETE /kpis`
  - `GET/PUT /kpis/:kpiId/period-targets`
  - `GET/PATCH /kpis/:kpiId/monthly-entries/:month`
  - `GET/PATCH /kpis/:kpiId/daily-entries/:date`
- `bonusConfigService`
  - `GET/POST/PATCH /bonus-configs`
  - `PUT /bonus-configs/:id/weight-overrides`
- `penaltyService`
  - `GET/POST/PATCH/DELETE /penalty-logics`

No endpoint/query/payload/response contract changed in FE.

## 3) Numeric Normalization Rule
- Numeric fields from BE may arrive as `number | string`.
- FE normalizes at API layer (`src/services/apiMappers.ts`) before data reaches UI:
  - `toNumber(...)` for required numeric values.
  - `toNullableNumber(...)` for nullable numeric values.
- UI/components should consume already-normalized data and avoid ad-hoc numeric parsing.
