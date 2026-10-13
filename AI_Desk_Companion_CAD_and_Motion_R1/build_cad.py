"""AI Desk Companion preliminary parametric CAD model.

Units: millimetres. Coordinate system: X width, Y depth (front is -Y), Z up.
This is an envelope/packaging prototype, not manufacturing-ready CAD.
Known vendor footprints are modelled approximately; unspecified part dimensions
remain adjustable placeholders. Requires CadQuery 2.8+.
"""
from pathlib import Path
import json, math, csv
import cadquery as cq
from cadquery import Vector

OUT = Path(__file__).resolve().parent
PARTS = OUT / 'parts'
PARTS.mkdir(exist_ok=True)

# Main envelope targets (mm)
P = {
    'overall_height_target_mm': 270,
    'head_width_mm': 104,
    'head_depth_mm': 77,
    'head_height_mm': 80,
    'head_center_z_mm': 224,
    'torso_width_mm': 70,
    'torso_depth_mm': 52,
    'torso_height_mm': 51,
    'torso_center_z_mm': 140.5,
    'leg_center_spacing_mm': 62,
    'leg_width_mm': 18,
    'leg_depth_mm': 22,
    'leg_height_mm': 100,
    'foot_width_mm': 58,
    'foot_depth_mm': 92,
    'foot_height_mm': 16,
    'head_wall_assumption_mm': 2.5,
    'assembly_width_target_mm': 180,
    'assembly_depth_target_mm': 130,
}

COLORS = {
 'graphite': (0.105,0.12,0.15), 'black': (0.025,0.032,0.045),
 'silver': (0.63,0.66,0.68), 'light_shell': (0.73,0.75,0.75),
 'teal': (0.0,0.78,0.82), 'cyan': (0.1,0.92,0.94), 'pcb': (0.04,0.34,0.22),
 'battery': (0.23,0.28,0.33), 'gold': (0.86,0.61,0.16), 'rubber': (0.055,0.06,0.065),
 'white': (0.86,0.87,0.85), 'red': (0.75,0.18,0.17), 'darkmetal': (0.20,0.22,0.24),
}
ITEMS = []

def add(name, shape, color='graphite', module='assembly', export_part=True):
    if isinstance(shape, cq.Workplane): shape = shape.val()
    ITEMS.append({'name':name, 'shape':shape, 'color':COLORS[color] if isinstance(color,str) else color,
                  'module':module, 'export_part':export_part})
    return shape

def rounded_box(dx, dy, dz, center=(0,0,0), r=2):
    """Rounded cuboid; dimensions include the rounded edges."""
    r = max(0.01, min(r, (min(dx,dy,dz)-0.05)/2))
    sh = cq.Workplane('XY').box(dx,dy,dz).edges().fillet(r).val()
    return sh.translate(Vector(*center))

def cylinder(radius, height, start, direction=(0,0,1)):
    d = Vector(*direction)
    return cq.Solid.makeCylinder(radius, height, Vector(*start), d)

def sphere(radius, center):
    return cq.Solid.makeSphere(radius, Vector(*center))

def rod_between(a, b, radius):
    va, vb = Vector(*a), Vector(*b)
    v = vb.sub(va)
    length = v.Length
    if length < 0.1: return sphere(radius, a)
    return cq.Solid.makeCylinder(radius, length, va, v.normalized())

def add_joint_disc(name, x, y, z, radius, depth, color='darkmetal', module='arms'):
    sh = cylinder(radius, depth, (x,y,z), (0,-1,0))
    add(name, sh, color, module)
    ring = cylinder(radius*0.62, depth+0.8, (x,y-0.2,z), (0,-1,0))
    add(name+'_accent', ring, 'teal', module)

# ---------------------------- Head module ----------------------------
head_ctr = (0,0,P['head_center_z_mm'])
head_outer = rounded_box(104,77,80,head_ctr,15)
# Open the rear and underside for electronics assembly; retain a robust front lip.
head_cavity = rounded_box(98,82,74,(0,2.5,218),12)  # rear and bottom breakthrough are intentional
head_shell = head_outer.cut(head_cavity)
add('Head_Shell_104x77x80', head_shell, 'graphite', 'head')

# Face bezel as a real ring, with screen inserted behind its aperture.
bezel_outer = rounded_box(82,4,57,(0,-39.1,224),12)
bezel_hole = rounded_box(70.5,8,45.5,(0,-39.1,224),8)
bezel = bezel_outer.cut(bezel_hole)
add('Face_Bezel', bezel, 'silver', 'head')
add('Face_Display_Window', rounded_box(69.5,1.4,44.5,(0,-39.4,224),7.5), 'black', 'head')
# Eyes
for i, x in enumerate([-16.5,16.5],1):
    add(f'Face_Eye_{i}', rounded_box(15,1.5,8.5,(x,-40.25,224),4), 'cyan', 'head')
# Camera lens above face
add('Camera_Lens_Ring', cylinder(5.3,3.2,(0,-38.1,252.2),(0,-1,0)), 'darkmetal','head')
add('Camera_Lens_Glass', cylinder(3.3,1.3,(0,-41.3,252.2),(0,-1,0)), 'teal','head')
add('Camera_Lens_Centre', cylinder(1.5,0.5,(0,-42.6,252.2),(0,-1,0)), 'black','head')
# Side circular accents / detachable-head ears
for side, label in [(-1,'L'),(1,'R')]:
    startx = side*51.5
    add(f'Head_Ear_Pad_{label}', cylinder(14.5,5.5,(startx,1,224),(side,0,0)), 'darkmetal','head')
    add(f'Head_Ear_Ring_{label}', cylinder(10.8,2.2,(side*57.0,1,224),(side,0,0)), 'teal','head')
    add(f'Head_Ear_Centre_{label}', cylinder(6.4,2.5,(side*59.2,1,224),(side,0,0)), 'graphite','head')
# Privacy switch placeholder on right flank
add('Physical_Camera_Privacy_Switch', rounded_box(5,13,7,(51.5,7,243),2), 'red','head')

# Internal packages are packaging envelopes, not detailed electrical models.
# Raspberry Pi board footprint is approximately 85 x 56 mm; exact STEP should replace this.
add('Pi5_PCB_Envelope_85x56', rounded_box(85,1.6,56,(0,8.1,224),0.8), 'pcb','head')
add('Pi5_Active_Cooler_Envelope', rounded_box(38,18,38,(0,-2.0,226),3), 'darkmetal','head')
add('Head_Battery_Envelope_78x10x32', rounded_box(78,10,32,(0,25,216),3), 'battery','head')
# Speaker placeholder, rear/lower right
add('Speaker_3W_Envelope', cylinder(10.5,7,(31,12,199),(0,1,0)), 'darkmetal','head')
add('Microphone_Array_PCB_Envelope', rounded_box(31,1.4,8,(0,17,251),1), 'pcb','head')
# Head underside contact carrier (mates to the body docking puck)
add('Head_Dock_Contact_Carrier', rounded_box(32,26,2.6,(0,0,185.7),3), 'darkmetal','head')
for idx,(x,y) in enumerate([(-9,-6),(-3,-6),(3,-6),(9,-6)],1):
    add(f'Head_Dock_Contact_{idx}', cylinder(1.6,1.3,(x,y,184.4),(0,0,1)), 'gold','head')

# ---------------------------- Body / torso ---------------------------
torso_outer = rounded_box(70,52,51,(0,0,140.5),10)
torso_cavity = rounded_box(60,56,43,(0,3.7,142),7)  # opens rear; leaves front, side, top and bottom walls
add('Torso_Shell', torso_outer.cut(torso_cavity), 'light_shell','body')
add('Torso_Chest_Insert', rounded_box(45,2.4,23,(0,-26.1,139),4), 'silver','body')
add('Body_Status_LED', rounded_box(13,1.6,2.8,(0,-27.1,151),1), 'cyan','body')
# neck riser and head dock
add('Neck_Riser', cylinder(12.5,13,(0,0,165),(0,0,1)), 'darkmetal','body')
add('Dock_Puck', cylinder(17,5,(0,0,178),(0,0,1)), 'graphite','body')
add('Dock_Contact_Plate', cylinder(12,1.2,(0,0,182.0),(0,0,1)), 'black','body')
for idx,(x,y) in enumerate([(-9,-6),(-3,-6),(3,-6),(9,-6)],1):
    add(f'Body_Pogo_Pin_{idx}', cylinder(1.3,2.0,(x,y,182.8),(0,0,1)), 'gold','body')
add('Dock_Key_Left', rounded_box(3,9,4,(-15,0,181.5),1), 'silver','body')
add('Dock_Key_Right', rounded_box(3,9,4,(15,0,181.5),1), 'silver','body')
# Controller envelope inside torso
add('ESP32_Controller_Envelope', rounded_box(35,1.6,24,(0,9,140),1), 'pcb','body')
add('Body_Battery_Envelope_55x10x24', rounded_box(55,10,24,(0,18,134),2), 'battery','body')

# ---------------------------- Legs and feet --------------------------
leg_x = P['leg_center_spacing_mm']/2
for side,label in [(-1,'L'),(1,'R')]:
    x = side*leg_x
    add(f'Structural_Leg_{label}', rounded_box(P['leg_width_mm'],P['leg_depth_mm'],P['leg_height_mm'],(x,2,67),3), 'graphite','legs')
    # shallow front panel to distinguish the leg assembly
    add(f'Leg_Front_Inlay_{label}', rounded_box(12,1.5,72,(x,-9.8,66),2), 'darkmetal','legs')
    add(f'Foot_Housing_{label}', rounded_box(P['foot_width_mm'],P['foot_depth_mm'],P['foot_height_mm'],(x,0,8),5), 'graphite','feet')
    add(f'Foot_Tread_Accent_{label}', rounded_box(P['foot_width_mm']-2,P['foot_depth_mm']-2,2.2,(x,0,2.6),4), 'teal','feet')
    add(f'Foot_Top_Cover_{label}', rounded_box(P['foot_width_mm']-8,P['foot_depth_mm']-12,2,(x,0,15.7),4), 'darkmetal','feet')

# ---------------------------- Arms / grippers ------------------------
# Mirrored servo arms; deliberately limited to a small expressive gesture envelope.
for side,label in [(-1,'L'),(1,'R')]:
    sx, ex, wx = side*38, side*59, side*78
    sh_z, el_z, wr_z = 148, 134, 121
    add_joint_disc(f'Shoulder_Servo_{label}',sx,-20,sh_z,12,9,'darkmetal','arms')
    # A thin actuator cap on the visible/front side
    add(f'Shoulder_Cap_{label}', cylinder(7,1.8,(sx,-29.2,sh_z),(0,-1,0)), 'teal','arms')
    # Structural links and pivot
    add(f'Upper_Arm_Link_{label}', rod_between((sx,-25,sh_z-2),(ex,-35,el_z+2),6.0), 'silver','arms')
    add_joint_disc(f'Elbow_Servo_{label}',ex,-31,el_z,9,8,'graphite','arms')
    add(f'Forearm_Link_{label}', rod_between((ex,-37,el_z-2),(wx,-43,wr_z+1),5.2), 'light_shell','arms')
    add(f'Wrist_Joint_{label}', sphere(6.4,(wx,-43,wr_z)), 'darkmetal','arms')
    add(f'Gripper_Palm_{label}', rounded_box(18,11,12,(side*80,-45,118),3), 'silver','arms')
    # Two inward-curving prongs. These are cosmetic motion envelopes, not a force-rated gripper.
    add(f'Gripper_Finger_A_{label}', rod_between((side*87,-48,117),(side*74,-51,113),3.1), 'darkmetal','arms')
    add(f'Gripper_Finger_B_{label}', rod_between((side*87,-48,121),(side*74,-51,125),3.1), 'darkmetal','arms')
    add(f'Gripper_Tip_A_{label}', sphere(3.2,(side*74,-51,113)), 'rubber','arms')
    add(f'Gripper_Tip_B_{label}', sphere(3.2,(side*74,-51,125)), 'rubber','arms')

if __name__ == '__main__':
    # ---------------------------- Validation/export ----------------------
    # Per-part geometry check and exports. Assembly overlaps are intentional at mating joints.
    errors=[]
    for item in ITEMS:
        sh=item['shape']
        if not sh.isValid(): errors.append(item['name'])
        if sh.BoundingBox().xlen <= 0 or sh.BoundingBox().ylen <= 0 or sh.BoundingBox().zlen <= 0:
            errors.append(item['name']+'_zero_bbox')
    if errors:
        raise RuntimeError('Invalid geometry: '+', '.join(errors))

    # Assembly, with color/style metadata kept in the STEP assembly.
    assy = cq.Assembly(name='AI_Desk_Companion_Preliminary_Assembly')
    for item in ITEMS:
        color = cq.Color(*item['color'])
        assy.add(item['shape'], name=item['name'], color=color)
    assy.save(str(OUT/'AI_Desk_Companion_Assembly.step'), exportType='STEP')

    # Exploded reference assembly for documentation only (not assembled dimensions).
    exploded = cq.Assembly(name='AI_Desk_Companion_Exploded_Reference')
    for item in ITEMS:
        name = item['name']
        dx=dy=dz=0.0
        if item['module']=='head': dz=34.0
        elif item['module']=='arms':
            dx = -16.0 if name.endswith('_L') or '_L_' in name else (16.0 if name.endswith('_R') or '_R_' in name else 0.0)
        elif item['module']=='legs':
            dx = -9.0 if name.endswith('_L') else (9.0 if name.endswith('_R') else 0.0)
        elif item['module']=='feet':
            dx = -9.0 if name.endswith('_L') else (9.0 if name.endswith('_R') else 0.0)
        moved = item['shape'].translate(Vector(dx,dy,dz)) if any((dx,dy,dz)) else item['shape']
        exploded.add(moved, name=name, color=cq.Color(*item['color']))
    exploded.save(str(OUT/'AI_Desk_Companion_Exploded.step'), exportType='STEP')

    # STL of complete envelope for quick slicer viewing (not a single-print body).
    compound = cq.Compound.makeCompound([it['shape'] for it in ITEMS])
    cq.exporters.export(compound, str(OUT/'AI_Desk_Companion_Assembly.stl'), tolerance=0.12, angularTolerance=0.12)

    # Individual STLs are localized on the build plate (centered X/Y, lowest Z=0).
    # The full assembly STL above retains assembly coordinates and is for viewing only.
    manifest=[]
    for item in ITEMS:
        b=item['shape'].BoundingBox()
        cx=(b.xmin+b.xmax)/2; cy=(b.ymin+b.ymax)/2
        local_shape=item['shape'].translate(Vector(-cx,-cy,-b.zmin))
        if item['export_part']:
            try:
                cq.exporters.export(local_shape, str(PARTS/(item['name']+'.stl')), tolerance=0.08, angularTolerance=0.08)
            except Exception as e:
                print('WARN export part',item['name'],e)
        manifest.append({'name':item['name'],'module':item['module'], 'bbox_x_mm':round(b.xlen,2), 'bbox_y_mm':round(b.ylen,2), 'bbox_z_mm':round(b.zlen,2), 'center_x_mm':round(cx,3), 'center_y_mm':round(cy,3), 'min_z_mm':round(b.zmin,3), 'geometry_valid':bool(item['shape'].isValid())})

    for module in sorted({it['module'] for it in ITEMS}):
        comp = cq.Compound.makeCompound([it['shape'] for it in ITEMS if it['module']==module])
        # Keep the global-coordinate module for context and export a normalized alternative.
        cq.exporters.export(comp, str(OUT/f'Module_{module.title()}.step'), exportType='STEP')
        bb=comp.BoundingBox(); local_comp=comp.translate(Vector(-(bb.xmin+bb.xmax)/2,-(bb.ymin+bb.ymax)/2,-bb.zmin))
        cq.exporters.export(local_comp, str(OUT/f'Module_{module.title()}_Local.step'), exportType='STEP')

    # Colored OpenSCAD preview using normalized part STLs restored to assembly coordinates.
    scad_lines=['// Generated preview of the complete assembly; edit build_cad.py for parametric geometry.','// Units: mm. Not a single printable object.']
    for item, rec in zip(ITEMS, manifest):
        rgb=item['color']; hx=''.join(f'{int(max(0,min(1,c))*255):02x}' for c in rgb)
        scad_lines.append(f'translate([{rec["center_x_mm"]},{rec["center_y_mm"]},{rec["min_z_mm"]}]) color("#{hx}") import("parts/{item["name"]}.stl");')
    (OUT/'assembly_view.scad').write_text('\n'.join(scad_lines)+'\n')
    with open(OUT/'geometry_manifest.csv','w',newline='') as f:
        w=csv.DictWriter(f,fieldnames=list(manifest[0])); w.writeheader(); w.writerows(manifest)
    with open(OUT/'design_parameters.json','w') as f: json.dump(P,f,indent=2)

    # Summary extents from actual generated shapes.
    allbb = compound.BoundingBox()
    summary={
     'parts_count':len(ITEMS), 'invalid_shape_count':len(errors),
     'assembly_bbox_mm':{'x':round(allbb.xlen,2),'y':round(allbb.ylen,2),'z':round(allbb.zlen,2)},
     'x_min':round(allbb.xmin,2),'x_max':round(allbb.xmax,2),
     'y_min':round(allbb.ymin,2),'y_max':round(allbb.ymax,2),
     'z_min':round(allbb.zmin,2),'z_max':round(allbb.zmax,2),
     'notes':['All dimensions are nominal preliminary values.','Internal boards, battery and cooler are bounding-envelope placeholders.','No exact material properties, fasteners, servo models, battery model or manufacturing tolerances are frozen.','Assembly compound contains overlapping component representations; do not slice as one printable object.']
    }
    with open(OUT/'geometry_check.json','w') as f: json.dump(summary,f,indent=2)
    print(json.dumps(summary,indent=2))
    print('Wrote',OUT)
