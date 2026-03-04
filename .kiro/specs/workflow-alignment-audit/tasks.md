# Implementation Plan: Workflow Alignment Audit

## Overview

This plan outlines the systematic audit and alignment of the SPMC EDCC referral system with the official process flow documentation. The audit follows a phased approach: Discovery → Gap Analysis → Verification → Remediation → Validation. Each phase builds on the previous to ensure comprehensive alignment with documented workflows.

## Tasks

- [ ] 1. Audit Django Models for Workflow Alignment
  - [ ] 1.1 Review Referral model STATUS_CHOICES against official workflow states
    - Compare current status values with official workflow documentation
    - Document any naming mismatches or missing statuses
    - _Requirements: 12.1_
  
  - [ ] 1.2 Verify required fields exist in Referral model
    - Check for cancellation_reason field
    - Check for expected_arrival_time field
    - Check for actual_arrival_time field
    - Check for triage_decision field values
    - Document any missing or incorrectly typed fields
    - _Requirements: 2.4, 3.6, 8.1, 8.5_
  
  - [ ] 1.3 Audit DepartmentAcceptance model
    - Review check_department_acceptance method for majority rule logic
    - Verify status field values (pending/accepted/rejected)
    - Check that all required fields exist (notes, accepted_by, accepted_at)
    - _Requirements: 6.5, 15.5_
  
  - [ ] 1.4 Audit TransitInfo model
    - Verify all required transit fields exist (contact_number, expected_arrival, etc.)
    - Check field types match requirements
    - _Requirements: 7.2, 15.6_
  
  - [-]* 1.5 Write property test for model field validation
    - **Property 4: Referral Creation Captures All Required Fields**
    - **Validates: Requirements 2.1**
  
  - [ ]* 1.6 Write property test for status field integrity
    - **Property 5: Draft Editing Preserves Status**
    - **Validates: Requirements 2.2**

- [ ] 2. Audit Status Transition Logic in Views
  - [ ] 2.1 Map all status transition endpoints
    - List all view methods that change referral status
    - Document current transition paths (from_status → to_status)
    - Compare with official workflow: Pending → In Triage → Waiting Acceptance → Awaiting Triage Verification → Dispositioned → In Transit → Completed
    - _Requirements: 12.1_
  
  - [ ] 2.2 Verify referral submission transitions
    - Check that new referrals start in "pending" status
    - Verify submission triggers EDCC/EDMA notifications
    - _Requirements: 2.3_
  
  - [ ] 2.3 Verify triage transition logic
    - Check transfer_to_triage method transitions to correct status
    - Verify emergent cases route to EMEDS
    - Verify urgent cases route to department assignment
    - Verify OPD cases route to outpatient scheduling
    - _Requirements: 3.2, 3.3, 3.4_
  
  - [ ] 2.4 Verify department workflow transitions
    - Check assign_departments transitions to "waiting_acceptance"
    - Verify department acceptance transitions correctly
    - Check that majority acceptance triggers triage verification
    - Verify rejection allows reassignment
    - _Requirements: 4.1, 6.2, 6.3, 6.5_
  
  - [ ] 2.5 Verify transit workflow transitions
    - Check approve_for_transit transitions to "dispositioned"
    - Verify fill_transit_info transitions to "in_transit"
    - Check arrival confirmation transitions to "completed"
    - Verify "Did Not Arrive" transitions to cancelled
    - _Requirements: 7.3, 8.2, 8.4_
  
  - [ ] 2.6 Verify cancellation logic
    - Check that cancellation is allowed from all statuses except "completed"
    - Verify cancellation_reason is captured
    - Check that cancellation triggers notifications
    - _Requirements: 2.4, 12.2_
  
  - [ ] 2.7 Verify status history logging
    - Check that ReferralStatusHistory records are created for all transitions
    - Verify timestamp, user, old_status, new_status are captured
    - _Requirements: 14.1_
  
  - [ ]* 2.8 Write property test for valid status transitions
    - **Property 43: Valid Status Transitions Enforced**
    - **Validates: Requirements 12.1**
  
  - [ ]* 2.9 Write property test for cancellation rules
    - **Property 44: Cancellation Allowed Except When Completed**
    - **Validates: Requirements 12.2**
  
  - [ ]* 2.10 Write property test for status history logging
    - **Property 49: Status History Logs All Transitions**
    - **Validates: Requirements 14.1**

- [ ] 3. Checkpoint - Review model and status transition findings
  - Compile findings from model audit (Task 1)
  - Compile findings from status transition audit (Task 2)
  - Document all identified gaps and misalignments
  - Ask the user if questions arise

- [ ] 4. Audit Role-Based Permission Logic
  - [ ] 4.1 Review UserProfile role properties
    - Check UserProfile.can_* properties for all roles
    - Verify role definitions match official workflow (referrer, edcc_personnel, call_triage, doctor, emeds)
    - Document any missing roles or incorrect role definitions
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_
  
  - [ ] 4.2 Audit referrer permissions
    - Verify referrers can only create/edit/cancel their own referrals
    - Check that pending referrers cannot submit referrals
    - Verify referrers can fill transit forms
    - _Requirements: 1.3, 10.1_
  
  - [ ] 4.3 Audit EDCC/EDMA triage permissions
    - Verify both EDCC and EDMA can perform triage decisions
    - Check that triage authority is equivalent for both roles
    - Verify permission checks in transfer_to_triage and related methods
    - _Requirements: 3.5, 10.2_
  
  - [ ] 4.4 Audit department assignment permissions
    - Verify only EDCC can assign departments
    - Check assign_departments method has proper permission checks
    - Verify reassignment permissions
    - _Requirements: 10.3_
  
  - [ ] 4.5 Audit department physician permissions
    - Verify only department physicians can accept/reject referrals for their department
    - Check department_decision method has proper permission checks
    - Verify physicians cannot act on other departments' referrals
    - _Requirements: 10.4_
  
  - [ ] 4.6 Audit transit operation permissions
    - Verify only EDCC can approve for transit
    - Check only EDCC can mark arrival/no arrival
    - Verify permission checks in approve_for_transit, mark_in_transit_completed methods
    - _Requirements: 10.5_
  
  - [ ] 4.7 Audit EMEDS permissions
    - Verify EMEDS role exists and has correct permissions
    - Check EMEDS can accept/reject emergent cases
    - Verify permission checks for emergent workflow
    - _Requirements: 10.6_
  
  - [ ] 4.8 Verify unauthorized action handling
    - Check that unauthorized actions return 403 Forbidden
    - Verify unauthorized attempts are logged
    - _Requirements: 10.7_
  
  - [ ]* 4.9 Write property test for referrer permissions
    - **Property 31: Referrer Role Restricted to Own Actions**
    - **Validates: Requirements 10.1**
  
  - [ ]* 4.10 Write property test for triage role permissions
    - **Property 32: Triage Role Restricted to EDMA/EDCC**
    - **Validates: Requirements 10.2**
  
  - [ ]* 4.11 Write property test for EDCC triage authority
    - **Property 11: EDCC Has Triage Authority**
    - **Validates: Requirements 3.5**
  
  - [ ]* 4.12 Write property test for unauthorized action handling
    - **Property 36: Unauthorized Actions Denied and Logged**
    - **Validates: Requirements 10.7**

- [ ] 5. Checkpoint - Review permission audit findings
  - Compile findings from permission audit (Task 4)
  - Document all permission gaps and misalignments
  - Ask the user if questions arise

- [ ] 6. Audit Triage Decision Workflow
  - [ ] 6.1 Review triage decision methods
    - Audit assign_departments method for triage routing logic
    - Audit accept_with_triage_decision method
    - Check that triage_decision field is properly set
    - _Requirements: 3.2, 3.3, 3.4_
  
  - [ ] 6.2 Verify emergent case routing
    - Check that emergent cases forward directly to EMEDS
    - Verify department assignment is skipped for emergent cases
    - Check EMEDS notification is triggered
    - Verify EMEDS acceptance transitions to transit phase
    - _Requirements: 3.2, 9.1, 9.2, 9.3_
  
  - [ ] 6.3 Verify urgent case routing
    - Check that urgent cases transition to department assignment
    - Verify EDCC is notified for department assignment
    - Check that assigned departments are notified
    - _Requirements: 3.3_
  
  - [ ] 6.4 Verify OPD case routing
    - Check that OPD cases set scheduled date/time
    - Verify referrer is notified with OPD appointment details
    - Check that OPD cases don't go through transit tracking
    - _Requirements: 3.4_
  
  - [ ] 6.5 Verify triage metadata recording
    - Check that triage_decision field is set correctly
    - Verify triaged_by field captures decision maker
    - Check that triaged_at timestamp is recorded
    - Verify triage_notes are captured
    - _Requirements: 3.6_
  
  - [ ] 6.6 Verify EMEDS rejection handling
    - Check that EMEDS rejection returns referral to triage
    - Verify reassessment is possible after EMEDS rejection
    - _Requirements: 9.4_
  
  - [ ]* 6.7 Write property test for emergent triage routing
    - **Property 8: Emergent Triage Forwards to EMEDS**
    - **Validates: Requirements 3.2, 9.1**
  
  - [ ]* 6.8 Write property test for urgent triage routing
    - **Property 9: Urgent Triage Assigns Departments**
    - **Validates: Requirements 3.3**
  
  - [ ]* 6.9 Write property test for OPD triage routing
    - **Property 10: OPD Triage Routes to Outpatient**
    - **Validates: Requirements 3.4**
  
  - [ ]* 6.10 Write property test for triage metadata recording
    - **Property 12: Triage Decision Records Metadata**
    - **Validates: Requirements 3.6**

- [ ] 7. Audit Department Assignment and Confirmation Workflow
  - [ ] 7.1 Review department assignment logic
    - Audit assign_departments method for main service assignment
    - Check co-manage department assignment logic
    - Verify DepartmentAcceptance records are created for all assigned departments
    - _Requirements: 4.1, 4.2_
  
  - [ ] 7.2 Verify department notification
    - Check that all assigned departments receive notifications
    - Verify notification content includes referral details
    - Check that main service and co-manage departments are both notified
    - _Requirements: 4.1, 4.2_
  
  - [ ] 7.3 Verify department queue visibility
    - Check that assigned referrals appear in department's incoming queue
    - Verify filtering by department works correctly
    - _Requirements: 4.3_
  
  - [ ] 7.4 Audit department decision logic
    - Review department_decision method for acceptance/rejection
    - Check that physician remarks are required
    - Verify DepartmentAcceptance status is updated correctly
    - _Requirements: 6.2, 6.3, 15.5_
  
  - [ ] 7.5 Verify majority acceptance rule
    - Audit check_department_acceptance method logic
    - Check that majority acceptance triggers triage verification status
    - Verify calculation is correct for various department counts
    - _Requirements: 6.5_
  
  - [ ] 7.6 Verify rejection and reassignment
    - Check that rejection allows EDCC to reassign departments
    - Verify rejection reason is captured
    - Check that EDCC/EDMA are notified of rejection
    - _Requirements: 6.3, 6.4_
  
  - [ ] 7.7 Verify assignment history tracking
    - Check that department assignments are logged in ReferralStatusHistory
    - Verify reassignments are tracked with old and new departments
    - Check timestamps are recorded
    - _Requirements: 4.5, 14.3_
  
  - [ ]* 7.8 Write property test for department assignment
    - **Property 13: Department Assignment Notifies Department**
    - **Validates: Requirements 4.1**
  
  - [ ]* 7.9 Write property test for majority acceptance rule
    - **Property 20: Majority Acceptance Triggers Verification**
    - **Validates: Requirements 6.5**
  
  - [ ]* 7.10 Write property test for department rejection workflow
    - **Property 19: Department Rejection Returns to Assignment**
    - **Validates: Requirements 6.3, 6.4**
  
  - [ ]* 7.11 Write property test for assignment history logging
    - **Property 17: Assignment History Tracks Changes**
    - **Validates: Requirements 4.5**

- [ ] 8. Checkpoint - Review triage and department workflow findings
  - Compile findings from triage audit (Task 6)
  - Compile findings from department workflow audit (Task 7)
  - Document all identified gaps and misalignments
  - Ask the user if questions arise

- [ ] 9. Audit Transit Tracking Workflow
  - [ ] 9.1 Review triage verification and transit approval
    - Audit approve_for_transit method
    - Check that triage verification is performed by EDCC/EDMA
    - Verify triage_verified_by and triage_verified_at are set
    - Check transition to "dispositioned" status
    - _Requirements: 7.1, 7.3_
  
  - [ ] 9.2 Verify transit template data capture
    - Audit fill_transit_info method
    - Check that TransitInfo captures all required fields
    - Verify contact_number, expected arrival time are required
    - Check that special instructions can be included
    - _Requirements: 7.2, 15.6_
  
  - [ ] 9.3 Verify transit approval notification
    - Check that referrer receives notification with transit details
    - Verify notification includes contact numbers and expected arrival
    - Check that transit approval transitions to "in_transit" status
    - _Requirements: 7.3_
  
  - [ ] 9.4 Verify delayed transfer handling
    - Audit delay_transfer method
    - Check that delay_notified_at timestamp is recorded
    - Verify delay_reason is captured
    - Check that referrer is notified of delay
    - _Requirements: 7.4, 7.5_
  
  - [ ] 9.5 Verify 24-hour arrival window tracking
    - Check that expected_arrival_time is set when transit starts
    - Verify system tracks 24-hour window
    - Check that overdue arrivals are flagged
    - _Requirements: 8.1_
  
  - [ ] 9.6 Verify arrival confirmation
    - Audit mark_in_transit_completed method
    - Check that actual_arrival_time is recorded
    - Verify transition to "completed" status
    - Check that all stakeholders are notified
    - _Requirements: 8.2, 8.5_
  
  - [ ] 9.7 Verify "Did Not Arrive" handling
    - Audit mark_in_transit_cancelled method
    - Check transition to cancelled status
    - Verify referrer is notified
    - Check that reason is captured
    - _Requirements: 8.4_
  
  - [ ]* 9.8 Write property test for transit approval workflow
    - **Property 22: Transit Approval Notifies Referrer**
    - **Validates: Requirements 7.3**
  
  - [ ]* 9.9 Write property test for arrival confirmation
    - **Property 25: Arrival Confirmation Completes Referral**
    - **Validates: Requirements 8.2**
  
  - [ ]* 9.10 Write property test for delayed transfer tracking
    - **Property 23: Delayed Transfer Records Reason**
    - **Validates: Requirements 7.4, 7.5**
  
  - [ ]* 9.11 Write property test for arrival timestamp recording
    - **Property 27: Arrival Timestamp Recorded**
    - **Validates: Requirements 8.5**

- [ ] 10. Audit Notification System Integration
  - [ ] 10.1 Review notification service implementation
    - Audit notificationService.ts for notification creation logic
    - Check notification data structure
    - Verify notification types are defined correctly
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_
  
  - [ ] 10.2 Verify referral submission notifications
    - Check that EDCC receives notification on submission
    - Verify EDMA receives notification on submission
    - Check notification content includes referral details
    - _Requirements: 11.1_
  
  - [ ] 10.3 Verify triage completion notifications
    - Check that referrer is notified after triage
    - Verify assigned departments are notified
    - Check notification includes triage decision and urgency
    - _Requirements: 11.2_
  
  - [ ] 10.4 Verify department decision notifications
    - Check that EDCC/EDMA are notified of acceptance/rejection
    - Verify referrer is notified of department decisions
    - Check notification includes physician remarks
    - _Requirements: 11.3_
  
  - [ ] 10.5 Verify transit approval notifications
    - Check that referrer receives transit details notification
    - Verify notification includes contact numbers and expected arrival
    - _Requirements: 11.4_
  
  - [ ] 10.6 Verify arrival notifications
    - Check that referrer is notified of patient arrival
    - Verify all involved departments are notified
    - _Requirements: 11.5_
  
  - [ ] 10.7 Verify cancellation/expiry notifications
    - Check that all stakeholders are notified on cancellation
    - Verify expiry notifications are sent after 24 hours
    - Check notification includes cancellation reason
    - _Requirements: 11.6_
  
  - [ ]* 10.8 Write property test for submission notifications
    - **Property 37: Submission Triggers EDCC/EDMA Notification**
    - **Validates: Requirements 11.1**
  
  - [ ]* 10.9 Write property test for triage completion notifications
    - **Property 38: Triage Completion Notifies Stakeholders**
    - **Validates: Requirements 11.2**
  
  - [ ]* 10.10 Write property test for department decision notifications
    - **Property 39: Department Decision Notifies All Parties**
    - **Validates: Requirements 11.3**

- [ ] 11. Checkpoint - Review transit and notification findings
  - Compile findings from transit workflow audit (Task 9)
  - Compile findings from notification audit (Task 10)
  - Document all identified gaps and misalignments
  - Ask the user if questions arise

- [ ] 12. Audit Referrer Account Management
  - [ ] 12.1 Review ReferrerAccount model and viewset
    - Audit ReferrerAccount model fields
    - Review ReferrerAccountViewSet for registration logic
    - Check approval/rejection endpoints
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [ ] 12.2 Verify registration creates pending accounts
    - Check that new registrations set is_active=False
    - Verify pending status prevents referral submission
    - Check that profile data is captured correctly
    - _Requirements: 1.1, 1.3_
  
  - [ ] 12.3 Verify authentication logic
    - Check that valid credentials grant access
    - Verify pending accounts can log in but cannot submit referrals
    - Check that approved accounts have full access
    - _Requirements: 1.2_
  
  - [ ] 12.4 Verify profile data persistence
    - Check that facility name, contact details, profession are stored
    - Verify profile data can be retrieved correctly
    - Check that profile updates work correctly
    - _Requirements: 1.4_
  
  - [ ]* 12.5 Write property test for referrer account creation
    - **Property 1: Referrer Account Creation Sets Pending Status**
    - **Validates: Requirements 1.1**
  
  - [ ]* 12.6 Write property test for pending referrer restrictions
    - **Property 2: Pending Referrers Cannot Submit Referrals**
    - **Validates: Requirements 1.3**
  
  - [ ]* 12.7 Write property test for profile data persistence
    - **Property 3: Referrer Profile Data Persists**
    - **Validates: Requirements 1.4**

- [ ] 13. Audit Data Validation Logic
  - [ ] 13.1 Review serializer validation rules
    - Audit ReferralSerializer for field validation
    - Check DepartmentAcceptanceSerializer validation
    - Review TransitInfoSerializer validation
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7_
  
  - [ ] 13.2 Verify referral creation validation
    - Check that mandatory patient demographics are required
    - Verify clinical information fields are required
    - Check that chief complaint and vital signs are validated
    - _Requirements: 15.1, 15.2_
  
  - [ ] 13.3 Verify triage decision validation
    - Check that urgency level is required
    - Verify triage remarks are required
    - Check that valid urgency values are enforced
    - _Requirements: 15.3_
  
  - [ ] 13.4 Verify department assignment validation
    - Check that at least one main service department is required
    - Verify department codes are validated
    - _Requirements: 15.4_
  
  - [ ] 13.5 Verify department decision validation
    - Check that physician remarks are required for acceptance/rejection
    - Verify decision status values are validated
    - _Requirements: 15.5_
  
  - [ ] 13.6 Verify transit approval validation
    - Check that contact numbers are required
    - Verify expected arrival time is required
    - Check that contact number format is validated
    - _Requirements: 15.6_
  
  - [ ] 13.7 Verify arrival confirmation validation
    - Check that actual arrival timestamp is required
    - Verify timestamp format is validated
    - _Requirements: 15.7_
  
  - [ ]* 13.8 Write property test for referral creation validation
    - **Property 55: Referral Creation Validates Demographics**
    - **Property 56: Referral Creation Validates Clinical Data**
    - **Validates: Requirements 15.1, 15.2**
  
  - [ ]* 13.9 Write property test for triage validation
    - **Property 57: Triage Requires Urgency and Remarks**
    - **Validates: Requirements 15.3**
  
  - [ ]* 13.10 Write property test for transit approval validation
    - **Property 60: Transit Approval Requires Contact Info**
    - **Validates: Requirements 15.6**

- [ ] 14. Checkpoint - Review account management and validation findings
  - Compile findings from referrer account audit (Task 12)
  - Compile findings from validation audit (Task 13)
  - Document all identified gaps and misalignments
  - Ask the user if questions arise

- [ ] 15. Audit Frontend Workflow Components
  - [ ] 15.1 Review triage interface components
    - Audit TriageReferrals.tsx for triage decision UI
    - Check that triage options match backend (emergent/urgent/schedule_opd)
    - Verify role-based visibility (EDCC/EDMA only)
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [ ] 15.2 Review department acceptance interface
    - Audit IncomingReferrals.tsx or equivalent for department queue
    - Check acceptance/rejection UI
    - Verify physician remarks input is required
    - Check role-based visibility (department physicians only)
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [ ] 15.3 Review referrer dashboard
    - Audit ReferrerDashboard.tsx for referrer workflow
    - Check referral creation/editing UI
    - Verify transit form filling UI
    - Check status display matches backend statuses
    - _Requirements: 2.1, 2.2, 7.2_
  
  - [ ] 15.4 Review action dropdown components
    - Audit TransferActionDropdown.tsx for workflow actions
    - Check that available actions match user role
    - Verify action labels match backend operations
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ] 15.5 Verify form validation consistency
    - Check that frontend validation matches backend validation
    - Verify error messages are clear and helpful
    - Check that required fields are marked correctly
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7_
  
  - [ ] 15.6 Verify status display consistency
    - Check that status labels match backend status values
    - Verify status colors/badges are consistent
    - Check that status transitions are reflected in UI
    - _Requirements: 12.1_

- [ ] 16. Create Comprehensive Gap Analysis Report
  - [ ] 16.1 Compile all audit findings
    - Gather findings from all audit tasks (1-15)
    - Organize by component (models, views, permissions, notifications, frontend)
    - _Requirements: All_
  
  - [ ] 16.2 Categorize gaps by severity
    - Critical: Breaks core workflow or causes data loss
    - High: Significant misalignment with official process
    - Medium: Minor misalignment or missing features
    - Low: Cosmetic or documentation issues
    - _Requirements: All_
  
  - [ ] 16.3 Document missing model fields
    - List all missing fields identified in model audits
    - Specify field types and constraints
    - Note which requirements are affected
    - _Requirements: 2.4, 8.1, 8.5_
  
  - [ ] 16.4 Document status transition issues
    - List incorrect or missing status transitions
    - Map current transitions vs. official workflow
    - Note which requirements are affected
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_
  
  - [ ] 16.5 Document permission issues
    - List missing or incorrect permission checks
    - Note which roles are affected
    - Specify which requirements are affected
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_
  
  - [ ] 16.6 Document notification gaps
    - List missing notification triggers
    - Note which workflow events lack notifications
    - Specify which requirements are affected
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_
  
  - [ ] 16.7 Create prioritized fix list
    - Order fixes by severity and dependencies
    - Group related fixes together
    - Estimate effort for each fix
    - _Requirements: All_

- [ ] 17. Checkpoint - Review gap analysis report
  - Review compiled gap analysis report
  - Verify all findings are documented
  - Confirm prioritization is appropriate
  - Ask the user if questions arise

- [ ] 18. Fix Critical Model Issues
  - [ ] 18.1 Add missing fields to Referral model
    - Add cancellation_reason field (TextField, null=True, blank=True)
    - Add expected_arrival_time field (DateTimeField, null=True, blank=True)
    - Add actual_arrival_time field (DateTimeField, null=True, blank=True)
    - _Requirements: 2.4, 8.1, 8.5_
  
  - [ ] 18.2 Create and run Django migration
    - Generate migration for new fields
    - Review migration file for correctness
    - Run migration on development database
    - Verify fields are added correctly
    - _Requirements: 2.4, 8.1, 8.5_
  
  - [ ] 18.3 Update serializers for new fields
    - Add new fields to ReferralSerializer
    - Set appropriate read_only and required flags
    - Update field documentation
    - _Requirements: 2.4, 8.1, 8.5_
  
  - [ ] 18.4 Update views to populate new fields
    - Update cancel_referral to set cancellation_reason
    - Update fill_transit_info to set expected_arrival_time
    - Update mark_in_transit_completed to set actual_arrival_time
    - _Requirements: 2.4, 8.1, 8.5_

- [ ] 19. Fix Status Transition Issues
  - [ ] 19.1 Update STATUS_CHOICES to match official workflow
    - Review and update status value names
    - Ensure status labels match official documentation
    - Update any hardcoded status strings in code
    - _Requirements: 12.1_
  
  - [ ] 19.2 Fix incorrect status transitions in views
    - Update transfer_to_triage for correct status transition
    - Fix assign_departments status transition
    - Update approve_for_transit status transition
    - Fix mark_in_transit_completed status transition
    - _Requirements: 12.1_
  
  - [ ] 19.3 Add missing status transition validations
    - Add validation to prevent department assignment before triage
    - Add validation to prevent transit approval before department acceptance
    - Add validation to prevent completion before arrival
    - _Requirements: 12.4, 12.5, 12.6_
  
  - [ ] 19.4 Ensure status history logging
    - Verify ReferralStatusHistory is created for all transitions
    - Add missing history creation calls
    - Ensure old_status, new_status, timestamp, user are captured
    - _Requirements: 14.1_
  
  - [ ] 19.5 Add invalid transition error handling
    - Add validation to reject invalid transitions
    - Return clear error messages
    - Log invalid transition attempts
    - _Requirements: 12.7_

- [ ] 20. Fix Permission Issues
  - [ ] 20.1 Add missing permission checks in views
    - Review all view methods for permission checks
    - Add @permission_required or manual checks where missing
    - Ensure consistent permission checking pattern
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_
  
  - [ ] 20.2 Verify EDCC and EDMA triage permissions
    - Ensure both roles have equivalent triage authority
    - Update permission checks to allow both roles
    - Test that both roles can perform triage actions
    - _Requirements: 3.5, 10.2_
  
  - [ ] 20.3 Add or verify EMEDS role
    - Check if EMEDS role exists in UserProfile
    - Add EMEDS role if missing
    - Implement EMEDS-specific permissions
    - _Requirements: 10.6_
  
  - [ ] 20.4 Fix incorrect role restrictions
    - Review and fix any overly permissive or restrictive checks
    - Ensure referrers can only act on their own referrals
    - Ensure department physicians can only act on their department's referrals
    - _Requirements: 10.1, 10.4_
  
  - [ ] 20.5 Add logging for unauthorized access
    - Implement logging for 403 Forbidden responses
    - Capture user, action attempted, and timestamp
    - Ensure logs are accessible for security review
    - _Requirements: 10.7_

- [ ] 21. Checkpoint - Review model and permission fixes
  - Verify all model fixes are complete and tested
  - Verify all permission fixes are complete and tested
  - Run existing tests to check for regressions
  - Ask the user if questions arise

- [ ] 22. Fix Triage Workflow Issues
  - [ ] 22.1 Ensure emergent cases skip department assignment
    - Review assign_departments logic for emergent cases
    - Verify emergent cases forward directly to EMEDS
    - Check that department assignment is bypassed
    - _Requirements: 3.2, 9.1_
  
  - [ ] 22.2 Verify urgent case department assignment
    - Check that urgent cases go through department assignment
    - Verify EDCC is notified for assignment
    - Ensure assigned departments are notified
    - _Requirements: 3.3_
  
  - [ ] 22.3 Fix OPD scheduling if broken
    - Verify OPD cases set scheduled date/time
    - Check that referrer is notified with appointment details
    - Ensure OPD cases don't enter transit tracking
    - _Requirements: 3.4_
  
  - [ ] 22.4 Ensure triage metadata recording
    - Verify triage_decision field is set correctly
    - Check triaged_by captures decision maker
    - Ensure triaged_at timestamp is recorded
    - Verify triage_notes are captured
    - _Requirements: 3.6_
  
  - [ ] 22.5 Add EMEDS notification for emergent cases
    - Implement notification trigger when emergent case is forwarded
    - Verify EMEDS receives immediate notification
    - Check notification content includes urgency indicator
    - _Requirements: 9.2_

- [ ] 23. Fix Department Workflow Issues
  - [ ] 23.1 Verify majority acceptance logic
    - Review check_department_acceptance method
    - Test with various department counts (1, 2, 3, 4, 5)
    - Ensure majority calculation is correct
    - Verify transition to triage verification status
    - _Requirements: 6.5_
  
  - [ ] 23.2 Fix reassignment after rejection
    - Verify EDCC can reassign after department rejection
    - Check that rejection reason is captured
    - Ensure new DepartmentAcceptance records are created
    - _Requirements: 6.3, 6.4_
  
  - [ ] 23.3 Ensure co-manage departments are notified
    - Verify all assigned departments (main and co-manage) receive notifications
    - Check notification content is appropriate for each department
    - _Requirements: 4.2_
  
  - [ ] 23.4 Fix department queue filtering
    - Verify assigned referrals appear in correct department queues
    - Check filtering by department code works correctly
    - Ensure only relevant referrals are shown
    - _Requirements: 4.3_
  
  - [ ] 23.5 Ensure assignment history logging
    - Verify department assignments are logged
    - Check reassignments are tracked with old and new departments
    - Ensure timestamps and user are captured
    - _Requirements: 4.5, 14.3_

- [ ] 24. Fix Transit Workflow Issues
  - [ ] 24.1 Ensure transit form captures required data
    - Verify TransitInfo captures contact_number
    - Check expected arrival time is captured
    - Ensure special instructions field exists
    - Verify all fields are validated
    - _Requirements: 7.2, 15.6_
  
  - [ ] 24.2 Fix 24-hour arrival window tracking
    - Implement expected_arrival_time setting on transit start
    - Add logic to check if 24 hours have passed
    - Implement overdue arrival flagging
    - _Requirements: 8.1_
  
  - [ ] 24.3 Verify arrival confirmation works correctly
    - Check mark_in_transit_completed sets actual_arrival_time
    - Verify transition to "completed" status
    - Ensure all stakeholders are notified
    - _Requirements: 8.2, 8.5_
  
  - [ ] 24.4 Fix "Did Not Arrive" handling
    - Verify mark_in_transit_cancelled transitions to cancelled
    - Check that referrer is notified
    - Ensure reason is captured
    - _Requirements: 8.4_
  
  - [ ] 24.5 Ensure delayed transfer notifications work
    - Verify delay_transfer sets delay_notified_at
    - Check delay_reason is captured
    - Ensure referrer receives delay notification
    - _Requirements: 7.4, 7.5_

- [ ] 25. Fix Notification Issues
  - [ ] 25.1 Add missing notification triggers
    - Review all workflow events against notification requirements
    - Implement missing notification creation calls
    - Ensure notification service is called at correct points
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_
  
  - [ ] 25.2 Verify notification content
    - Check that notifications include relevant referral details
    - Verify notification messages are clear and actionable
    - Ensure notification types are set correctly
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_
  
  - [ ] 25.3 Fix notification delivery if broken
    - Verify in-app notifications are created correctly
    - Check that notifications appear in user's notification panel
    - Test notification marking as read
    - _Requirements: 11.7_
  
  - [ ] 25.4 Ensure all stakeholders receive notifications
    - Verify EDCC/EDMA receive submission notifications
    - Check referrer receives triage, decision, and transit notifications
    - Ensure departments receive assignment and arrival notifications
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [ ] 26. Fix Validation Issues
  - [ ] 26.1 Add missing validation rules in serializers
    - Review all serializers for missing required field validations
    - Add custom validation methods where needed
    - Ensure validation matches requirements
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7_
  
  - [ ] 26.2 Ensure error messages are clear
    - Review all validation error messages
    - Update messages to be user-friendly and actionable
    - Ensure field names in errors match UI labels
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7_
  
  - [ ] 26.3 Fix overly strict or lenient validation
    - Review validation rules for appropriateness
    - Adjust validation to match official requirements
    - Test edge cases
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7_

- [ ] 27. Checkpoint - Review workflow and validation fixes
  - Verify all triage workflow fixes are complete
  - Verify all department workflow fixes are complete
  - Verify all transit workflow fixes are complete
  - Verify all notification fixes are complete
  - Verify all validation fixes are complete
  - Run all tests to check for regressions
  - Ask the user if questions arise

- [ ] 28. Update Frontend Components
  - [ ] 28.1 Update triage interface
    - Update TriageReferrals.tsx to match fixed backend workflow
    - Ensure triage options match backend values
    - Fix role-based visibility if broken
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [ ] 28.2 Update department acceptance interface
    - Update department queue components to match backend
    - Fix acceptance/rejection UI if broken
    - Ensure physician remarks input is required
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [ ] 28.3 Update referrer dashboard
    - Update ReferrerDashboard.tsx to match backend workflow
    - Fix referral creation/editing forms
    - Update transit form to include all required fields
    - _Requirements: 2.1, 2.2, 7.2_
  
  - [ ] 28.4 Update action dropdown components
    - Update TransferActionDropdown.tsx to match backend actions
    - Fix role-based action visibility
    - Ensure action labels are clear
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ] 28.5 Fix status display mismatches
    - Update status labels to match backend STATUS_CHOICES
    - Fix status colors/badges if inconsistent
    - Ensure status transitions are reflected in UI
    - _Requirements: 12.1_
  
  - [ ] 28.6 Update form validation
    - Ensure frontend validation matches backend validation
    - Add missing required field indicators
    - Update validation error messages
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7_

- [ ] 29. Create Integration Tests for Workflow Paths
  - [ ] 29.1 Write end-to-end test for emergent workflow
    - Test: Referral submission → Triage as emergent → EMEDS acceptance → Transit → Arrival
    - Verify all status transitions
    - Check all notifications are triggered
    - _Requirements: 3.2, 9.1, 9.2, 9.3_
  
  - [ ] 29.2 Write end-to-end test for urgent workflow
    - Test: Referral submission → Triage as urgent → Department assignment → Acceptance → Transit approval → Transit → Arrival
    - Verify all status transitions
    - Check all notifications are triggered
    - _Requirements: 3.3, 4.1, 6.2, 7.3, 8.2_
  
  - [ ] 29.3 Write end-to-end test for OPD workflow
    - Test: Referral submission → Triage as OPD → Scheduling → Completion
    - Verify status transitions
    - Check notifications
    - _Requirements: 3.4_
  
  - [ ] 29.4 Write test for cancellation at various stages
    - Test cancellation from pending, in_triage, waiting_acceptance, dispositioned, in_transit
    - Verify status transitions to cancelled
    - Check cancellation notifications
    - Verify cancellation_reason is captured
    - _Requirements: 2.4, 12.2_
  
  - [ ] 29.5 Write test for rejection and reassignment
    - Test: Department assignment → Rejection → Reassignment → Acceptance
    - Verify status transitions
    - Check rejection notifications
    - Verify reassignment creates new DepartmentAcceptance records
    - _Requirements: 6.3, 6.4_
  
  - [ ] 29.6 Write test for delayed transfer
    - Test: Transit approval → Delay notification → Eventual transit
    - Verify delay_notified_at and delay_reason are set
    - Check delay notification is sent
    - _Requirements: 7.4, 7.5_
  
  - [ ] 29.7 Write test for "Did Not Arrive" scenario
    - Test: Transit → 24 hours pass → Mark as "Did Not Arrive"
    - Verify status transitions to cancelled
    - Check notifications
    - _Requirements: 8.3, 8.4_

- [ ] 30. Create Workflow Documentation
  - [ ] 30.1 Document aligned workflow with diagrams
    - Create workflow diagram showing all status transitions
    - Document decision points and routing logic
    - Include role responsibilities at each stage
    - _Requirements: All_
  
  - [ ] 30.2 Create user guides for each role
    - Write guide for Referrers
    - Write guide for EDCC personnel
    - Write guide for EDMA
    - Write guide for Department Physicians
    - Write guide for EMEDS
    - _Requirements: All_
  
  - [ ] 30.3 Document all status transitions
    - Create status transition matrix
    - Document valid and invalid transitions
    - Include transition triggers and conditions
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_
  
  - [ ] 30.4 Create troubleshooting guide
    - Document common issues and solutions
    - Include error messages and their meanings
    - Provide debugging steps for workflow problems
    - _Requirements: All_
  
  - [ ] 30.5 Document notification triggers
    - List all notification events
    - Document who receives each notification
    - Include notification content templates
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [ ] 31. Final Checkpoint - Complete Validation
  - Run all unit tests and verify they pass
  - Run all property-based tests and verify they pass
  - Run all integration tests and verify they pass
  - Verify all requirements are met
  - Confirm alignment with official process flow documentation
  - Review all documentation for completeness
  - Ask the user if questions arise

- [ ] 32. Create Deployment Plan
  - [ ] 32.1 Document database migration steps
    - List all migrations in order
    - Document any data transformations needed
    - Include rollback procedures for each migration
    - _Requirements: All model changes_
  
  - [ ] 32.2 Create rollback plan
    - Document how to revert each change
    - Include database rollback steps
    - Document code rollback procedures
    - _Requirements: All_
  
  - [ ] 32.3 Document configuration changes
    - List any environment variable changes
    - Document any settings.py updates
    - Include any infrastructure changes
    - _Requirements: All_
  
  - [ ] 32.4 Create deployment checklist
    - Pre-deployment verification steps
    - Deployment execution steps
    - Post-deployment verification steps
    - Rollback trigger conditions
    - _Requirements: All_
  
  - [ ] 32.5 Plan user communication
    - Draft announcement of workflow changes
    - Create user training materials
    - Schedule training sessions if needed
    - Prepare FAQ for common questions
    - _Requirements: All_

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster completion
- Each audit task should document findings in a structured format (use the gap analysis report)
- Fixes should be implemented in order of severity: Critical → High → Medium → Low
- All changes should maintain backward compatibility where possible
- Database migrations should be tested thoroughly in development before production deployment
- User roles and permissions should be verified in production after deployment
- The audit follows a phased approach: Discovery (Tasks 1-15) → Gap Analysis (Task 16) → Remediation (Tasks 18-26) → Validation (Tasks 27-31) → Deployment (Task 32)
- Checkpoints are included after each major phase to review progress and address questions
- Integration tests should cover all critical workflow paths to ensure end-to-end correctness
- Documentation should be updated to reflect the aligned workflow for future reference
