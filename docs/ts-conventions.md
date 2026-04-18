# TypeScript Conventions (FE KPI)

## Layering
- `src/types/api/*`: DTO/response contracts matching current BE.
- `src/services/*`: API access + normalization only.
- `src/hooks/*`: data orchestration (`data/loading/error/reload` pattern).
- UI components: consume normalized data, avoid direct API calls.

## Naming
- Enum-like constants: `*_ENUM`.
- Type aliases/interfaces: `Api*` for raw API contracts.
- Numeric mappers: `toNumber`, `toNullableNumber`.

## Safety Rules
- Do not change route path or role access rules in migration commits.
- Do not alter endpoint path/query/payload/response shape.
- Avoid `@ts-ignore`; fix type at source or constrain scope in tsconfig wave-by-wave.

## Quality Gate
- Required before merge:
  - `npm run lint`
  - `npm run build`
  - `npm run typecheck`
  - `npm run typecheck:strict`
