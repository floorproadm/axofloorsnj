# Archived RLS Policies

This document contains RLS policies that were removed during security review and cleanup.

## Removed Policies

### Gallery Projects Table

#### ❌ REMOVED: "Admin users can manage all gallery projects" (Original Version)
**Removed Date**: September 22, 2025  
**Reason**: Potential RLS recursion due to direct subquery on profiles table

```sql
-- DEPRECATED POLICY (DO NOT USE)
CREATE POLICY "Admin users can manage all gallery projects" 
ON public.gallery_projects 
FOR ALL 
USING (
  EXISTS ( 
    SELECT 1
    FROM profiles
    WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))
  )
);
```

**Issue**: This policy used a direct EXISTS subquery that referenced the `profiles` table, which could cause infinite recursion in RLS policy evaluation.

**Replacement**: Updated to use the `get_current_user_role()` security definer function:
```sql
-- CURRENT POLICY (SECURE)
CREATE POLICY "Admin users can manage all gallery projects" 
ON public.gallery_projects 
FOR ALL 
USING (get_current_user_role() = 'admin');
```

## Policy Migration Notes

### Security Improvements Made:
1. **Eliminated RLS Recursion Risk**: All admin policies now use security definer functions instead of direct table queries
2. **Added Policy Documentation**: All policies now have descriptive comments explaining their purpose
3. **Standardized Admin Access**: All admin functionality uses the `get_current_user_role()` function consistently

### Best Practices Applied:
- ✅ Use security definer functions for role-based access
- ✅ Avoid direct table queries in RLS policies
- ✅ Document policy purposes with SQL comments
- ✅ Test policies after changes to ensure functionality

---
*Last Updated: September 22, 2025*  
*Next Review: December 22, 2025*