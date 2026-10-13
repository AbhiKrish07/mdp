AI DESK COMPANION — CAD & MOTION PACKAGE R1

START HERE
1. Read AI_Desk_Companion_CAD_and_Motion_Engineering_Report_R1.pdf.
2. Open AI_Desk_Companion_Assembly_Motion_R1.step in FreeCAD, Fusion 360, SolidWorks or another STEP-capable CAD program. This is the full standing robot with the articulated arms in neutral pose and grippers open.
3. For other static pose models, open the matching STEP files in motion_revision_R1/:
   - AI_Desk_Companion_Neutral_Open_R1.step
   - AI_Desk_Companion_Wave_Left_R1.step
   - AI_Desk_Companion_Wave_Right_R1.step
   - AI_Desk_Companion_Point_Both_R1.step
   - AI_Desk_Companion_Nudge_Both_R1.step
   - AI_Desk_Companion_Reach_Forward_R1.step
   - AI_Desk_Companion_Gripper_Closed_R1.step
4. To see interpolated motion, open motion_revision_R1/AI_Desk_Companion_Motion_Animated.scad in OpenSCAD, then enable View > Animate. Suggested starting values: FPS 12, Steps 60.
5. arm_and_gripper_motion_demo.gif and motion_pose_sheet.png are quick previews.

WHAT THE MOTION MODEL INCLUDES
- One shoulder-pitch joint and one elbow-pitch joint per arm (4 arm-joint actuators total).
- One coupled open/close gripper actuator per hand (2 more actuators).
- Total proposed arm actuation: 6 channels.
- Two separate fingers/jaws per hand with a nominal 22.6 mm open tip-centre spacing and 5.6 mm closed tip-centre spacing.
- Pose tables, axes and ranges in joint_and_actuator_spec.csv and kinematic_pose_definitions.json.

IMPORTANT LIMITATIONS
- OpenSCAD animation is a visual kinematic concept; the STEP poses are static solids, not joint-constrained assemblies.
- Servo envelopes are placeholders. Exact actuators, horn/linkage, clearances, bearings, fasteners, cable routing and torque/current calculations still need design.
- The hand geometry is not force-rated. Do not use it to lift objects until a coupled jaw linkage and pinch-force limits are engineered and tested.
- The two legs and feet are fixed structural supports. This model does not walk or drive around a desk. Head tilt is not included.
- Geometry checks report 0 invalid individual solids; this is not a collision, strength, thermal, stability or safety validation.
- R0.1 files are included for reference; for arm geometry use the R1 motion_revision_R1 files.
