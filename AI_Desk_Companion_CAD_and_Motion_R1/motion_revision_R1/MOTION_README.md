# AI Desk Companion — articulated arms & grippers R1

This revision addresses the request for Cosmo-inspired expressive arms and moving pinch-gripper hands. The assemblies contain separate shoulder links, elbow links, pivot housings, forearms, palms, hinge pins and jaw fingers. Each STEP pose is a static geometry snapshot generated from the angles in `pose_angle_table.csv`; STEP does not preserve joint constraints or animate by itself.

## Pose exports

- `AI_Desk_Companion_Neutral_Open_R1.step` — neutral pose, jaws open.
- `AI_Desk_Companion_Wave_Left_R1.step` / `Wave_Right` — one arm raised.
- `AI_Desk_Companion_Point_Both_R1.step` — both arms forward.
- `AI_Desk_Companion_Nudge_Both_R1.step` — both arms reach forward/up.
- `AI_Desk_Companion_Gripper_Closed_R1.step` — same neutral arm pose with jaws closed.
- `AI_Desk_Companion_Reach_Forward_R1.step` — slightly extended reach.
- `Arms_and_Grippers_Articulated_R1.step` — arm subassembly only, neutral/open.
- `Arm_Left_Articulated_R1.step`, `Arm_Right_Articulated_R1.step` — respective arm in neutral/open pose.

## Kinematics

Each arm has 2 rotational joints (shoulder pitch and elbow pitch) and one coupled gripper actuator. Total preliminary arm actuator count is six. The pose angles are nominal demonstration values, not validated safe travel limits. Joint axes, ranges and pose definitions are listed in the CSV/JSON files.

## Important limitations

1. Servos and gripper motors are represented by size envelopes; no servo part number has been selected.
2. Torque, current draw, gear backlash, linkage ratios, fastener design, interference across the entire motion range and pinch force are not validated.
3. Gripper jaws are modeled in several discrete positions. Actual movement requires mechanical pivots, a coupling linkage and a controller.
4. Body legs and feet are stationary structural supports; the model does not drive or walk.
5. Head tilt is excluded because the current detachable electrical dock needs a separate hinge/carrier redesign to tilt while maintaining electrical contact.
6. This is a prototype geometry update, not a manufacturing release.
