from pathlib import Path
import math, os, sys, tempfile
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import PolyCollection
import imageio.v2 as imageio

BASE=Path(__file__).resolve().parent
# Evaluate the R1 design generator to get geometry constructors and kinematic helpers.
ns={'__file__':str(BASE/'build_motion_revision.py'),'__name__':'motion_preview_import'}
exec(compile((BASE/'build_motion_revision.py').read_text(),str(BASE/'build_motion_revision.py'),'exec'),ns)
OUT=BASE/'motion_revision_R1'
base_items=ns['base_items']
arm_pose=ns['arm_pose']
make_pose=ns['make_pose']
COLORS=ns['COLORS']

# Pre-tessellate static body/head/legs once.
def mesh_part(item):
    verts, tris = item['shape'].tessellate(1.0,0.25)
    if not tris: return []
    vv=np.array([[v.x,v.y,v.z] for v in verts])
    col=item['color']
    out=[]
    for tri in tris:
        p=vv[list(tri)]
        out.append((float(p[:,1].mean()),p[:,[0,2]],col))
    return out
static_cache={id(i['shape']):mesh_part(i) for i in base_items}

def draw_front(ax, items, title=None, cache=True):
    faces=[]
    for it in items:
        if cache and id(it['shape']) in static_cache:
            part_faces=static_cache[id(it['shape'])]
        else:
            part_faces=mesh_part(it)
        faces.extend(part_faces)
    # Back (+Y) geometry first, front (-Y) on top.
    faces.sort(key=lambda t:t[0],reverse=True)
    polys=[f[1] for f in faces]
    cols=[f[2] for f in faces]
    edges=[tuple(max(0,c*0.68) for c in col) for col in cols]
    pc=PolyCollection(polys,facecolors=cols,edgecolors=edges,linewidths=0.08,antialiased=True)
    ax.add_collection(pc)
    ax.set_xlim(-82,82); ax.set_ylim(-2,278); ax.set_aspect('equal',adjustable='box')
    ax.set_facecolor('#f3f1eb'); ax.axis('off')
    if title: ax.set_title(title,loc='left',fontsize=11,fontweight='bold',color='#18313B',pad=5)

def custom_pose(left, right):
    items=[dict(i) for i in base_items]
    angles={}
    for side,label,vals in [(-1,'left',left),(1,'right',right)]:
        sh,el,ap=vals
        angles[label]=arm_pose(items,side,'Motion',sh,el,ap)
    return items,angles

# Static 6-pose movement sheet.
pose_keys=['Neutral_Open','Wave_Left','Wave_Right','Point_Both','Nudge_Both','Gripper_Closed']
labels=['01  NEUTRAL / OPEN GRIPPERS','02  WAVE LEFT','03  WAVE RIGHT','04  POINT / REACH','05  NUDGE GESTURE','06  GRIPPERS CLOSED']
fig,axs=plt.subplots(2,3,figsize=(13,10),dpi=180,facecolor='#e9e7e0')
for ax,key,label in zip(axs.flat,pose_keys,labels):
    items,_=make_pose(key)
    draw_front(ax,items,label)
    ax.set_xlim(-90,90)
fig.suptitle('AI DESK COMPANION — ARTICULATED ARM & GRIPPER POSES (R1)',fontsize=16,fontweight='bold',x=0.04,ha='left',y=0.99,color='#142831')
fig.text(0.04,0.955,'Discrete CAD snapshots of shoulder pitch, elbow pitch and coupled jaw aperture; not a validated full-motion collision simulation.',fontsize=9,color='#4b555a')
fig.tight_layout(rect=[0.02,0.02,0.98,0.94],h_pad=1.4,w_pad=1.0)
fig.savefig(OUT/'motion_pose_sheet.png',facecolor='#e9e7e0',bbox_inches='tight')
plt.close(fig)

# Animated front-view demonstration: neutral -> wave -> point -> nudge -> grip open/close.
frames=[]
transitions=[
    ((-25,40,1),(-25,40,1),(45,-55,1),(-25,40,1)), # raise left arm
    ((45,-55,1),(-25,40,1),(-25,40,1),(-25,40,1)), # return
    ((-25,40,1),(-25,40,1),(0,0,1),(0,0,1)), # point
    ((0,0,1),(0,0,1),(-20,55,1),(-20,55,1)), # nudge
    ((-20,55,1),(-20,55,1),(-25,40,1),(-25,40,1)), # neutral
]
# Store frame endpoints as (left_start,right_start,left_end,right_end); interpolate each arm's 3 values.
for tr in transitions:
    ls,rs,le,re=tr
    for i in range(5):
        t=i/5
        left=tuple((1-t)*a+t*b for a,b in zip(ls,le))
        right=tuple((1-t)*a+t*b for a,b in zip(rs,re))
        items,_=custom_pose(left,right)
        fig=plt.figure(figsize=(4.4,5.6),dpi=110,facecolor='#f3f1eb')
        ax=fig.add_axes([0.02,0.02,0.96,0.92])
        draw_front(ax,items)
        ax.set_xlim(-85,85)
        fig.text(0.06,0.965,'AI DESK COMPANION  •  MOTION PREVIEW',fontsize=9,fontweight='bold',color='#18313B')
        fig.canvas.draw()
        rgba=np.asarray(fig.canvas.buffer_rgba())
        frames.append(rgba[:,:,:3].copy())
        plt.close(fig)
# Jaw close/open cycle while arms are in neutral.
for a in [0.8,0.6,0.4,0.2,0.0,0.2,0.4,0.6,0.8,1.0]:
    items,_=custom_pose((-25,40,a),(-25,40,a))
    fig=plt.figure(figsize=(4.4,5.6),dpi=110,facecolor='#f3f1eb')
    ax=fig.add_axes([0.02,0.02,0.96,0.92])
    draw_front(ax,items)
    ax.set_xlim(-85,85)
    fig.text(0.06,0.965,'AI DESK COMPANION  •  GRIPPER OPEN / CLOSE',fontsize=9,fontweight='bold',color='#18313B')
    fig.canvas.draw()
    rgba=np.asarray(fig.canvas.buffer_rgba())
    frames.append(rgba[:,:,:3].copy())
    plt.close(fig)
imageio.mimsave(OUT/'arm_and_gripper_motion_demo.gif',frames,duration=0.12,loop=0)
print('Rendered',OUT/'motion_pose_sheet.png','and',OUT/'arm_and_gripper_motion_demo.gif','frames=',len(frames))
