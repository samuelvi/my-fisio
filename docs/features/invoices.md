# Billing & Invoicing Module

Complete solution for generating, managing, and exporting fiscal documents.

## Overview

The Billing module handles the financial aspect of the clinic. It allows for the creation of legal invoices linked to patients or standalone customers, ensuring compliance with sequential numbering and data integrity.

## Key Capabilities

### 1. Invoice Generation
- **Sequential Numbering**: Automatically generates legal invoice numbers (e.g., `F2026000001`) to prevent gaps or duplicates.
- **Line Items**: Add multiple services/products per invoice with automatic total calculation.
- **Data Prefill**: Import billing details directly from a Patient profile to save time.

### 2. Customer Management
- **Separate Entity**: Customers are distinct from Patients (e.g., a parent paying for a child).
- **Tax Data**: Stores NIF/CIF/DNI and official billing address independently.

### 3. Gap Detection
- **Compliance Tool**: Dedicated "Gap Analysis" view to identify missing invoice numbers in the sequence (crucial for tax audits).

### 4. Output & Export
- **PDF Generation**: Robust HTML-to-PDF conversion using `dompdf`.
- **Branding**: Invoices include the clinic's logo and official data header.

## User Workflows

### Creating an Invoice for a Patient
1. Go to "Patients" and select a patient.
2. Click "Generate Invoice".
3. The Invoice Form opens with Patient data pre-filled.
4. Add line items (Concept, Price).
5. Click "Confirm Issuance".
6. *Invoice is saved and number is assigned.*

### Checking for Gaps
1. Navigate to "Invoices" -> "Gaps".
2. System analyzes the sequence for the current year.
3. View report of any missing numbers.

## Technical Details

### Backend Structure
- **Entity**: `App\Domain\Entity\Invoice`
- **Generators**: `App\Domain\Service\InvoiceNumberGenerator` (Ensures atomic sequences)
- **PDF Engine**: `App\Infrastructure\Service\PdfGenerator` (Wraps `dompdf`)

### Frontend Components
- **List**: `assets/components/invoices/InvoiceList.tsx`
- **Form**: `assets/components/invoices/InvoiceForm.tsx` (Supports Drafts)
- **Gaps**: `assets/components/invoices/InvoiceGaps.tsx`

### Validation Rules
- **Immutability**: Once issued, an invoice number cannot be changed.
- **Uniqueness**: Composite unique index on `[year, number]`.
