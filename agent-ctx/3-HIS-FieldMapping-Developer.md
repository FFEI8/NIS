# Task ID: 3 - HIS FieldMapping Developer

## Work Summary

Significantly improved the HIS Integration Analysis page with 6 major feature enhancements.

## Changes Made

### 1. Fix alert() → toast notifications (sonner)
- Added `import { toast } from 'sonner'` to his-integration-analysis.tsx
- Added Sonner Toaster (`<SonnerToaster />`) to `/src/app/layout.tsx`
- Replaced `alert(result.message)` with `toast.error(result.message)` in handleSaveMapping
- Added `toast.success()` for all successful CRUD operations:
  - Field mapping created: `toast.success('字段映射已创建')`
  - Field mapping updated: `toast.success('字段映射已更新')`
  - Field mapping deleted: `toast.success('字段映射已删除')`
  - Warning config saved: `toast.success('预警配置已保存')`
  - CSV export: `toast.success('已导出 N 条字段映射')`
  - Batch operations: success toasts for batch enable/disable/delete

### 2. Visual Mapping Diagram Tab ("映射关系图")
- Added new `mapping-diagram` tab with Network icon
- Created `MappingDiagram` SVG component that shows:
  - System fields on the left, HIS fields on the right
  - Bezier curve connections between mapped fields
  - Color-coded lines: green=mapped, amber=risk, red=required unmapped, gray=unmapped
  - Dashed lines for unmapped fields
  - Hover tooltip showing transform rule
  - Click on line/field to edit mapping
  - Required field indicators (red dots)
- Added per-scenario mapping stats cards with completion %, risk count, required-unmapped count
- Click on scenario card to switch diagram view

### 3. Batch Operations for Field Mappings
- Added checkbox column in the field mapping table
- Added select-all checkbox in table header
- Added batch action bar (appears when items are selected):
  - 批量启用 (Batch Enable)
  - 批量禁用 (Batch Disable)
  - 导出选中 (Export Selected to CSV)
  - 批量删除 (Batch Delete)
  - 取消选择 (Clear Selection)
  - Shows count of selected items
- Added `selectedMappingIds` state (Set<string>)
- Added `batchProcessing` state
- Implemented `handleBatchDelete`, `handleBatchToggleStatus` handlers
- Selection cleared when scenario changes

### 4. Mapping Health Check Feature
- Added "健康检查" button with Heart icon in the header
- Created `handleHealthCheck` function that analyzes all field mappings for:
  - Required fields without HIS mapping (high severity)
  - Fields with consistency risks (medium severity)
  - Required fields missing validation rules (medium severity)
  - DateTime/Enum fields without transform rules (low severity)
- Calculates health score (0-100) based on issue deductions
- Health check dialog shows:
  - Circular SVG score indicator (color-coded)
  - Status text (健康状态良好/需要关注/存在严重问题)
  - Issues grouped by severity (高/中/低)
  - Each issue shows category, scenario, field name, and description

### 5. Save Warning Config to Backend
- Modified `saveWarningConfig` to save all 4 config values to SystemConfig API:
  - `temperature_warning_auto_report` (boolean)
  - `temperature_warning_fever_threshold` (number)
  - `temperature_warning_report_fever_level` (string)
  - `temperature_warning_target_depts` (comma-separated string)
- Modified `/api/system-configs` POST route to support upsert by configKey
- Still saves to localStorage as fallback
- Added error toast on failure

### 6. Field Mapping CSV Export
- Added "导出CSV" button in mapping tab header
- Implemented `handleExportCSV` function that:
  - Generates CSV with BOM marker for Excel compatibility
  - Headers: 系统字段, 系统标签, 数据类型, 长度, 必填, HIS字段, HIS表名, 转换规则, 特殊逻辑, 校验规则, 一致性风险
  - Supports exporting all fields or only selected fields
  - Auto-downloads with descriptive filename
- Batch action bar also has "导出选中" button

### Additional Fixes
- Fixed pre-existing lint error in page.tsx (setState in effect)
- Added Network icon import from lucide-react

## Files Modified
- `/src/components/pages/his-integration-analysis.tsx` - Main page (2015 → 2589 lines)
- `/src/app/layout.tsx` - Added Sonner Toaster
- `/src/app/api/system-configs/route.ts` - Added upsert support
- `/src/app/page.tsx` - Fixed lint error

## Verification
- Lint passes with 0 errors
- Dev server compiles successfully
- API endpoints verified working (his-mapping, system-configs upsert)
