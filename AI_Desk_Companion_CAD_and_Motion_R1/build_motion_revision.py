"""R1 articulated arm/gripper motion revision for AI Desk Companion.
Coordinates in mm. Base body/legs/head are inherited from the R0.1 packaging model.
All actuator and gripper details are preliminary geometry placeholders, not selected hardware.
"""
from pathlib import Path
import sys, math, json, csv, shutil
import cadquery as cq
from cadquery import Vector

BASE = Path(__file__).resolve().parent
OUT = BASE / 'motion_revision_R1'
OUT.mkdir(exist_ok=True)

# Load the base geometry definitions without running its exporter.
ns = {'__file__': str(BASE/'build_cad.py'), '__name__': 'base_model_import'}
exec(compile((BASE/'build_cad.py').read_text(), str(BASE/'build_cad.py'), 'exec'), ns)
base_items = [i for i in ns['ITEMS'] if i['module'] != 'arms']
COLORS = ns['COLORS']

# Calibrated design targets for small, expressive, non-load-bearing desk-robot gestures.
ARM = {
    'shoulder_left': [-37.0, -20.0, 147.0],
    'shoulder_right': [37.0, -20.0, 147.0],
    'upper_link_length_mm': 28.0,
    'forearm_link_length_mm': 26.0,
    'shoulder_pitch_range_deg': [-35, 50],
    'elbow_relative_range_deg': [-60, 65],
    'gripper_open_gap_mm': 22.6,
    'gripper_closed_tip_center_gap_mm': 5.6,
    'axes': {
        'shoulder_pitch': 'X axis through shoulder center; motion in Y-Z plane',
        'elbow_pitch': 'X axis through elbow center; relative angle added to shoulder pitch',
        'gripper_jaws': 'Z axis through each jaw pivot; coupled open/close mechanism'
    },
    'actuator_count': '6 arm actuators total: 2 arm joints + 1 gripper actuator per arm',
    'not_included': 'No active leg locomotion; legs/feet remain structural. STEP pose files are static snapshots, not constraint-driven CAD animation.'
}

POSES = {
    'Neutral_Open': {'left': ( -25, 40, True),  'right': (-25, 40, True)},
    'Wave_Left':    {'left': (  45,-55, True),  'right': (-25, 40, True)},
    'Wave_Right':   {'left': ( -25, 40, True),  'right': ( 45,-55, True)},
    'Point_Both':   {'left': (   0,  0, True),  'right': (  0,  0, True)},
    'Nudge_Both':   {'left': ( -20, 55, True),  'right': (-20, 55, True)},
    'Gripper_Closed': {'left': (-25,40,False), 'right': (-25,40,False)},
    'Reach_Forward': {'left': ( -8, 10, True),  'right': ( -8, 10, True)},
}

def rounded_box(dx, dy, dz, center=(0,0,0), r=2):
    r = max(0.01, min(r, (min(dx,dy,dz)-0.05)/2))
    sh = cq.Workplane('XY').box(dx,dy,dz).edges().fillet(r).val()
    return sh.translate(Vector(*center))

def add_part(items, name, shape, color='graphite', module='arms'):
    if isinstance(shape, cq.Workplane): shape = shape.val()
    items.append({'name':name, 'shape':shape, 'color':COLORS[color] if isinstance(color,str) else color,
                  'module':module, 'export_part':True})
    return shape

def cylinder_center(radius, depth, center, axis='x'):
    x,y,z = center
    if axis == 'x': return cq.Solid.makeCylinder(radius, depth, Vector(x-depth/2,y,z), Vector(1,0,0))
    if axis == 'y': return cq.Solid.makeCylinder(radius, depth, Vector(x,y-depth/2,z), Vector(0,1,0))
    return cq.Solid.makeCylinder(radius, depth, Vector(x,y,z-depth/2), Vector(0,0,1))

def rounded_link_between(a, b, width, thickness, color='silver', r=2):
    va, vb = Vector(*a), Vector(*b)
    v = vb.sub(va)
    length = v.Length
    if length < 0.1:
        return cq.Solid.makeSphere(max(width, thickness)/2, va)
    sh = cq.Workplane('XY').box(width, thickness, length).edges().fillet(min(r,width/3,thickness/3,length/6)).val()
    direction = v.normalized()
    zaxis = Vector(0,0,1)
    dot = max(-1.0, min(1.0, zaxis.dot(direction)))
    angle = math.degrees(math.acos(dot))
    axis = zaxis.cross(direction)
    if axis.Length > 1e-7:
        sh = sh.rotate((0,0,0), axis.toTuple(), angle)
    elif dot < 0:
        sh = sh.rotate((0,0,0), (1,0,0), 180)
    midpoint = (va.add(vb)).multiply(0.5)
    return sh.translate(midpoint)

def point_from_yz(origin, length, angle_deg):
    theta = math.radians(angle_deg)
    return (origin[0], origin[1] - length*math.cos(theta), origin[2] + length*math.sin(theta))

def arm_pose(items, side, pose_name, shoulder_angle, elbow_relative, jaw_open):
    label = 'L' if side < 0 else 'R'
    sx, sy, sz = (side*37.0, -20.0, 147.0)
    s = (sx,sy,sz)
    e = point_from_yz(s, ARM['upper_link_length_mm'], shoulder_angle)
    end_angle = shoulder_angle + elbow_relative
    w = point_from_yz(e, ARM['forearm_link_length_mm'], end_angle)
    palm = (w[0], w[1]-5.0, w[2])

    # Shoulder pod, pivot axis, link and serviceable joint cover.
    add_part(items, f'{label}_{pose_name}_Shoulder_Pod', rounded_box(20,20,22,(sx,sy+2.0,sz),5), 'graphite')
    add_part(items, f'{label}_{pose_name}_Shoulder_Servo_Envelope_Approx', rounded_box(12,20,22,(sx+side*3.8,sy+4.0,sz),2), 'darkmetal')
    add_part(items, f'{label}_{pose_name}_Shoulder_Pivot', cylinder_center(10.2,12,s,'x'), 'darkmetal')
    add_part(items, f'{label}_{pose_name}_Shoulder_Ring', cylinder_center(7.1,12.8,s,'x'), 'teal')
    add_part(items, f'{label}_{pose_name}_Upper_Arm_Link', rounded_link_between(s,e,14,12,'silver',3), 'silver')
    # Elbow enclosure and joint; the joint axis is transverse X.
    add_part(items, f'{label}_{pose_name}_Elbow_Servo_Envelope_Approx', rounded_box(14,18,18,e,4), 'graphite')
    add_part(items, f'{label}_{pose_name}_Elbow_Pivot', cylinder_center(8.2,14,e,'x'), 'darkmetal')
    add_part(items, f'{label}_{pose_name}_Elbow_Ring', cylinder_center(5.1,14.8,e,'x'), 'teal')
    add_part(items, f'{label}_{pose_name}_Forearm_Link', rounded_link_between(e,w,12,10, 'light_shell', 2.5), 'light_shell')
    # Wrist gimbal/body and compact palm.
    add_part(items, f'{label}_{pose_name}_Wrist_Joint', cylinder_center(5.8,12,w,'x'), 'darkmetal')
    add_part(items, f'{label}_{pose_name}_Palm', rounded_box(18,15,12,palm,3.5), 'silver')
    # Gripper actuator envelope. A linkage should mechanically couple both jaws.
    servo_center=(palm[0],palm[1]+2.0,palm[2])
    add_part(items, f'{label}_{pose_name}_Gripper_Servo_Envelope_Approx', rounded_box(9,8,7,servo_center,1.2), 'darkmetal')
    # Symmetric pinch jaws pivot around vertical Z pins; open and closed states use same link length.
    jaw_pivot_y = palm[1]-5.2
    pivot_offset = 4.2
    aperture = (1.0 if jaw_open else 0.0) if isinstance(jaw_open, bool) else max(0.0, min(1.0, float(jaw_open)))
    dx_tip = (-1.4 * (1.0-aperture)) + (7.3 * aperture)
    dy_tip = (-14.6 * (1.0-aperture)) + (-12.8 * aperture)
    for jaw_side, jaw_label in [(-1,'Inner_L'),(1,'Inner_R')]:
        pivot=(palm[0]+jaw_side*pivot_offset, jaw_pivot_y, palm[2])
        tip=(palm[0]+jaw_side*(pivot_offset+dx_tip), jaw_pivot_y+dy_tip, palm[2])
        add_part(items, f'{label}_{pose_name}_{jaw_label}_Jaw_Hinge', cylinder_center(2.7,5,pivot,'z'), 'darkmetal')
        add_part(items, f'{label}_{pose_name}_{jaw_label}_Finger_Link', rounded_link_between(pivot,tip,5.2,4.6,'graphite',1.3), 'graphite')
        add_part(items, f'{label}_{pose_name}_{jaw_label}_Soft_Tip', cq.Solid.makeSphere(2.8, Vector(*tip)), 'rubber')
    return {'shoulder':s,'elbow':e,'wrist':w,'palm':palm,'angles_deg':{'shoulder_pitch':shoulder_angle,'elbow_relative':elbow_relative,'gripper_open':jaw_open}}

def make_pose(name):
    items=[dict(i) for i in base_items]
    kinematics={}
    for side,label in [(-1,'left'),(1,'right')]:
        sh,el,jaw=POSES[name][label]
        kinematics[label]=arm_pose(items,side,name,sh,el,jaw)
    return items, kinematics

def export_step(items, path, assembly_name):
    a=cq.Assembly(name=assembly_name)
    for item in items:
        a.add(item['shape'],name=item['name'],color=cq.Color(*item['color']))
    a.save(str(path),exportType='STEP')

def export_compound(items,path):
    comp=cq.Compound.makeCompound([i['shape'] for i in items])
    cq.exporters.export(comp,str(path),tolerance=0.12,angularTolerance=0.12)

def make_arm_module(items, side):
    return [i for i in items if i['module']=='arms' and (i['name'].startswith(('L_','R_')) and i['name'].startswith('L_' if side<0 else 'R_'))]

manifest=[]
pose_summaries={}
for pose_name in POSES:
    items,kin=make_pose(pose_name)
    step_path=OUT/f'AI_Desk_Companion_{pose_name}_R1.step'
    export_step(items,step_path,f'AI_Desk_Companion_{pose_name}_R1')
    if pose_name=='Neutral_Open':
        export_compound(items,OUT/'AI_Desk_Companion_Assembly_Motion_R1.stl')
        # neutral individual pose arm files and subassemblies
        for side,label in [(-1,'Left'),(1,'Right')]:
            arm_items=make_arm_module(items,side)
            export_step(arm_items,OUT/f'Arm_{label}_Articulated_R1.step',f'Articulated_Arm_{label}_R1')
        arm_items=[i for i in items if i['module']=='arms']
        export_step(arm_items,OUT/'Arms_and_Grippers_Articulated_R1.step','Arms_and_Grippers_Articulated_R1')
    pose_summaries[pose_name]=kin
    for it in items:
        bb=it['shape'].BoundingBox()
        manifest.append({'pose':pose_name,'name':it['name'],'module':it['module'],'bbox_x_mm':round(bb.xlen,2),'bbox_y_mm':round(bb.ylen,2),'bbox_z_mm':round(bb.zlen,2),'geometry_valid':bool(it['shape'].isValid())})

# Export a pose-neutral geometry manifest and a joint-axis/control table.
with open(OUT/'kinematic_pose_definitions.json','w') as f:
    json.dump({'units':'mm, degrees','coordinates':'X width; Y depth with front = negative Y; Z up','arm_model':ARM,'poses':pose_summaries},f,indent=2)
with open(OUT/'pose_angle_table.csv','w',newline='') as f:
    w=csv.writer(f); w.writerow(['Pose','Side','Shoulder pitch (deg)','Elbow relative (deg)','Gripper']);
    for name,sideposes in POSES.items():
        for side,val in sideposes.items(): w.writerow([name,side,val[0],val[1],'open' if val[2] else 'closed'])
with open(OUT/'joint_and_actuator_spec.csv','w',newline='') as f:
    w=csv.writer(f); w.writerow(['Joint/assembly','Axis / motion','Proposed range','Actuator count','Notes'])
    w.writerow(['Left shoulder pitch','X axis; arm raises/lowers in Y-Z plane','-35 to +50 deg',1,'Servo envelope placeholder; select actuator from torque calculations'])
    w.writerow(['Left elbow pitch','X axis; relative to upper arm','-60 to +65 deg',1,'Servo envelope placeholder; mechanical stops required'])
    w.writerow(['Left gripper','Coupled jaw rotation about Z axes','22.6 mm open tip-center gap to 5.6 mm closed tip-center gap',1,'One servo plus linkage; closed gap is not zero'])
    w.writerow(['Right shoulder pitch','X axis; arm raises/lowers in Y-Z plane','-35 to +50 deg',1,'Mirror of left shoulder'])
    w.writerow(['Right elbow pitch','X axis; relative to upper arm','-60 to +65 deg',1,'Mirror of left elbow'])
    w.writerow(['Right gripper','Coupled jaw rotation about Z axes','22.6 mm open tip-center gap to 5.6 mm closed tip-center gap',1,'One servo plus linkage'])
    w.writerow(['Head tilt','Not implemented in this arm revision','Not specified',0,'Requires a separate neck hinge/dock redesign to preserve electrical connection'])
    w.writerow(['Leg/body locomotion','Not implemented','N/A',0,'Current design has structural legs and broad feet, no wheel/track drive'])
with open(OUT/'MOTION_README.md','w') as f:
    f.write('''# AI Desk Companion — articulated arms & grippers R1\n\n''')
    f.write('''This revision addresses the request for Cosmo-inspired expressive arms and moving pinch-gripper hands. The assemblies contain separate shoulder links, elbow links, pivot housings, forearms, palms, hinge pins and jaw fingers. Each STEP pose is a static geometry snapshot generated from the angles in `pose_angle_table.csv`; STEP does not preserve joint constraints or animate by itself.\n\n''')
    f.write('''## Pose exports\n\n- `AI_Desk_Companion_Neutral_Open_R1.step` — neutral pose, jaws open.\n- `AI_Desk_Companion_Wave_Left_R1.step` / `Wave_Right` — one arm raised.\n- `AI_Desk_Companion_Point_Both_R1.step` — both arms forward.\n- `AI_Desk_Companion_Nudge_Both_R1.step` — both arms reach forward/up.\n- `AI_Desk_Companion_Gripper_Closed_R1.step` — same neutral arm pose with jaws closed.\n- `AI_Desk_Companion_Reach_Forward_R1.step` — slightly extended reach.\n- `Arms_and_Grippers_Articulated_R1.step` — arm subassembly only, neutral/open.\n- `Arm_Left_Articulated_R1.step`, `Arm_Right_Articulated_R1.step` — respective arm in neutral/open pose.\n\n''')
    f.write('''## Kinematics\n\nEach arm has 2 rotational joints (shoulder pitch and elbow pitch) and one coupled gripper actuator. Total preliminary arm actuator count is six. The pose angles are nominal demonstration values, not validated safe travel limits. Joint axes, ranges and pose definitions are listed in the CSV/JSON files.\n\n''')
    f.write('''## Important limitations\n\n1. Servos and gripper motors are represented by size envelopes; no servo part number has been selected.\n2. Torque, current draw, gear backlash, linkage ratios, fastener design, interference across the entire motion range and pinch force are not validated.\n3. Gripper jaws are modeled in several discrete positions. Actual movement requires mechanical pivots, a coupling linkage and a controller.\n4. Body legs and feet are stationary structural supports; the model does not drive or walk.\n5. Head tilt is excluded because the current detachable electrical dock needs a separate hinge/carrier redesign to tilt while maintaining electrical contact.\n6. This is a prototype geometry update, not a manufacturing release.\n''')

# report basic geometry shape checks across unique neutral assembly only
neutral,kin=make_pose('Neutral_Open')
invalid=[i['name'] for i in neutral if not i['shape'].isValid()]
bb=cq.Compound.makeCompound([i['shape'] for i in neutral]).BoundingBox()
check={'revision':'R1 articulated-arm pose model','nominal_overall_bbox_mm':{'x':round(bb.xlen,2),'y':round(bb.ylen,2),'z':round(bb.zlen,2)},'component_count':len(neutral),'invalid_shape_count':len(invalid),'invalid_shape_names':invalid,'verification_scope':'individual solid validity only; no collision, strength, torque, tolerance or physical tests','pose_count':len(POSES)}
with open(OUT/'motion_geometry_check.json','w') as f: json.dump(check,f,indent=2)
print(json.dumps(check,indent=2))
print('Wrote motion revision to',OUT)
