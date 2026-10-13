from pathlib import Path
import json, csv, math, shutil
import cadquery as cq
from cadquery import Vector
BASE=Path(__file__).resolve().parent
OUT=BASE/'motion_revision_R1'
ns={'__file__':str(BASE/'build_motion_revision.py'),'__name__':'motion_export_import'}
exec(compile((BASE/'build_motion_revision.py').read_text(),str(BASE/'build_motion_revision.py'),'exec'),ns)
make_pose=ns['make_pose']
COLORS=ns['COLORS']
base_manifest={}
with open(BASE/'geometry_manifest.csv',newline='') as f:
    for row in csv.DictReader(f): base_manifest[row['name']]=row

def hexcol(col): return '#'+''.join(f'{int(max(0,min(1,c))*255):02x}' for c in col)

def export_pose_parts(pose_name):
    items,_=make_pose(pose_name)
    part_dir=OUT/f'parts_{pose_name}'
    part_dir.mkdir(exist_ok=True)
    lines=['// Generated OpenSCAD display model. NOT a manufacturing file.','// Each STL is a component positioned in assembly coordinates.']
    for it in items:
        sh=it['shape']; b=sh.BoundingBox()
        cx=(b.xmin+b.xmax)/2; cy=(b.ymin+b.ymax)/2; zmin=b.zmin
        is_arm=it['module']=='arms'
        if is_arm:
            local=sh.translate(Vector(-cx,-cy,-zmin))
            fn=it['name']+'.stl'
            cq.exporters.export(local,str(part_dir/fn),tolerance=0.18,angularTolerance=0.18)
            source_folder=part_dir.name
        else:
            fn=it['name']+'.stl'
            existing=BASE/'parts'/fn
            if not existing.exists():
                local=sh.translate(Vector(-cx,-cy,-zmin))
                cq.exporters.export(local,str(part_dir/fn),tolerance=0.18,angularTolerance=0.18)
                source_folder=part_dir.name
            else:
                source_folder='../parts'
        rel=f'{source_folder}/{fn}'
        col=hexcol(it['color'])
        lines.append(f'translate([{cx:.4f},{cy:.4f},{zmin:.4f}]) color("{col}") import("{rel}");')
    scad=OUT/f'assembly_{pose_name}.scad'
    scad.write_text('\n'.join(lines)+'\n')
    return scad

for pose in ['Neutral_Open','Wave_Left','Point_Both','Gripper_Closed']:
    p=export_pose_parts(pose)
    print('Created',p)
