from pathlib import Path
import math
import cadquery as cq
BASE=Path(__file__).resolve().parent
OUT=BASE/'motion_revision_R1'
ns={'__file__':str(BASE/'build_cad.py'),'__name__':'base_model_import'}
exec(compile((BASE/'build_cad.py').read_text(),str(BASE/'build_cad.py'),'exec'),ns)
items=[it for it in ns['ITEMS'] if it['module']!='arms']
COLORS=ns['COLORS']

def hcol(c): return '#'+''.join(f'{int(max(0,min(1,v))*255):02x}' for v in c)
lines=['''// AI Desk Companion — live arm/gripper motion concept, R1
// Open this file in OpenSCAD; enable View > Animate and set FPS / Steps.
// Static base geometry is imported as colored STL parts; arms and fingers are parametric SCAD solids.
// This is a visual kinematic demonstration, not a collision-safe or force-validated robot simulation.
$fn=28;
animated = true;  // set false to use motion_t below
motion_t = 0.0;   // in [0,1], used when animated=false
T = animated ? $t : motion_t;

function lerp(a,b,u)=a+(b-a)*u;
function sm(u)=let(v=max(0,min(1,u))) v*v*(3-2*v);
function stepval(t,a,b,c,d,e,f)=
  t<0.2 ? lerp(a,b,sm(t/0.2)) :
  t<0.4 ? lerp(b,c,sm((t-0.2)/0.2)) :
  t<0.6 ? lerp(c,d,sm((t-0.4)/0.2)) :
  t<0.8 ? lerp(d,e,sm((t-0.6)/0.2)) :
          lerp(e,f,sm((t-0.8)/0.2));
function pointYZ(p,L,a)=[p[0],p[1]-L*cos(a),p[2]+L*sin(a)];
function linklen(p,q)=sqrt(pow(q[0]-p[0],2)+pow(q[1]-p[1],2)+pow(q[2]-p[2],2));

module rounded_box(size,r=2) {
  minkowski() {
    cube([max(0.1,size[0]-2*r),max(0.1,size[1]-2*r),max(0.1,size[2]-2*r)],center=true);
    sphere(r=r,$fn=16);
  }
}
module link(a,b,r,c) {
  color(c) hull() {
    translate(a) scale([1.08,0.82,0.86]) sphere(r=r,$fn=18);
    translate(b) scale([1.08,0.82,0.86]) sphere(r=r,$fn=18);
  }
}
module joint_disc(p,r=9,d=12,c="#262a32") {
  color(c) translate(p) rotate([0,90,0]) cylinder(r=r,h=d,center=true);
}
module hand_gripper(palm, aperture=1) {
  color("#d0d2d0") translate(palm) rounded_box([18,15,12],3.2);
  color("#22262c") translate([palm[0],palm[1]+2,palm[2]]) rounded_box([9,8,7],1.2);
  for (j=[-1,1]) {
    pivot=[palm[0]+j*4.2,palm[1]-5.2,palm[2]];
    dx=lerp(-1.4,7.3,aperture);
    dy=lerp(14.6,12.8,aperture);
    tip=[palm[0]+j*(4.2+dx),palm[1]-5.2-dy,palm[2]];
    color("#30343b") translate(pivot) cylinder(r=2.7,h=5,center=true);
    link(pivot,tip,2.6,"#292d34");
    color("#343941") translate(tip) sphere(r=2.8);
  }
}
module arm(side, shoulder_angle, elbow_relative, aperture=1) {
  S=[side*37,-20,147];
  E=pointYZ(S,28,shoulder_angle);
  W=pointYZ(E,26,shoulder_angle+elbow_relative);
  P=[W[0],W[1]-5,W[2]];
  color("#252a32") translate([S[0],S[1]+2,S[2]]) rounded_box([20,20,22],5);
  color("#252a32") translate([S[0]+side*3.8,S[1]+4,S[2]]) rounded_box([12,20,22],2);
  joint_disc(S,10.2,12,"#20242b");
  joint_disc(S,7.1,12.8,"#09bfc8");
  link(S,E,6.7,"#c4c8c8");
  color("#242830") translate(E) rounded_box([14,18,18],3.5);
  joint_disc(E,8.2,14,"#242830");
  joint_disc(E,5.1,14.8,"#09bfc8");
  link(E,W,5.7,"#d3d5d2");
  joint_disc(W,5.8,12,"#252a32");
  hand_gripper(P,aperture);
}

// Motion cycle: neutral -> wave left -> neutral -> point both -> nudge -> neutral.
// Gripper jaws open/close slowly during the cycle; motion ranges are conceptual.
left_shoulder=stepval(T,-25,45,-25,0,-20,-25);
left_elbow=stepval(T,40,-55,40,0,55,40);
right_shoulder=stepval(T,-25,-25,-25,0,-20,-25);
right_elbow=stepval(T,40,40,40,0,55,40);
jaw=0.5+0.5*cos(720*T);

''']
# Add static non-arm component imports from R0.1.
lines.append('// STATIC BASE (head, torso, dock, structural legs and feet)')
for it in items:
    sh=it['shape']; b=sh.BoundingBox(); cx=(b.xmin+b.xmax)/2; cy=(b.ymin+b.ymax)/2; zmin=b.zmin
    fn=it['name']+'.stl'
    path=BASE/'parts'/fn
    if not path.exists():
        local=sh.translate(cq.Vector(-cx,-cy,-zmin))
        cq.exporters.export(local,str(path),tolerance=0.12,angularTolerance=0.12)
    lines.append(f'translate([{cx:.4f},{cy:.4f},{zmin:.4f}]) color("{hcol(it["color"])}") import("../parts/{fn}");')
lines += ['','// ARTICULATED ARMS + GRIPPERS','arm(-1,left_shoulder,left_elbow,jaw);','arm(1,right_shoulder,right_elbow,jaw);','']
path=OUT/'AI_Desk_Companion_Motion_Animated.scad'
path.write_text('\n'.join(lines))
print(path)
