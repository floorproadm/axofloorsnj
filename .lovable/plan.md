

# Plan: Create Test Data for Proposals Flow

## Objective
Insert seed data to create a test client already at the stage where proposals can be generated, so you can visualize the full proposals workflow.

## Data to Insert (4 steps, all via data insert tool)

### 1. Create a test customer
- Name: "Demo Client — Oakwood Residence"
- Email: demo@test.com, Phone: (555) 000-0000
- Address: 123 Oak Street, Summit, NJ 07901

### 2. Create a project linked to that customer
- project_type: "sanding_refinish"
- project_status: "pending"
- square_footage: 850
- customer data from step 1

### 3. Create job_costs with valid margin (above 30%)
- labor_cost: 1,200
- material_cost: 800
- additional_costs: 200
- estimated_revenue: 4,500
- This gives: total_cost = 2,200, margin = ~51% (well above 30% minimum)

### 4. Create a lead at "in_draft" stage linked to the project
- Status: `in_draft`
- converted_to_project_id: the project from step 2
- customer_id: the customer from step 1

This will make the "New Proposal" button work for this project — you can generate a Good/Better/Best proposal and see it appear in the pipeline board.

## No code changes needed
All data inserted via database. The existing Proposals page will display everything once the data exists.

