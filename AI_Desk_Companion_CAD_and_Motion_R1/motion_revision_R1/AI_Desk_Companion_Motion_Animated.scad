// AI Desk Companion — live arm/gripper motion concept, R1
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


// STATIC BASE (head, torso, dock, structural legs and feet)
translate([0.0000,-0.2913,189.2500]) color("#1a1e26") import("../parts/Head_Shell_104x77x80.stl");
translate([0.0000,-39.1000,195.5000]) color("#a0a8ad") import("../parts/Face_Bezel.stl");
translate([0.0000,-39.4000,201.7500]) color("#06080b") import("../parts/Face_Display_Window.stl");
translate([-16.5000,-40.2500,219.7500]) color("#19eaef") import("../parts/Face_Eye_1.stl");
translate([16.5000,-40.2500,219.7500]) color("#19eaef") import("../parts/Face_Eye_2.stl");
translate([0.0000,-39.7000,246.9000]) color("#33383d") import("../parts/Camera_Lens_Ring.stl");
translate([0.0000,-41.9500,248.9000]) color("#00c6d1") import("../parts/Camera_Lens_Glass.stl");
translate([0.0000,-42.8500,250.7000]) color("#06080b") import("../parts/Camera_Lens_Centre.stl");
translate([-54.2500,1.0000,209.5000]) color("#33383d") import("../parts/Head_Ear_Pad_L.stl");
translate([-58.1000,1.0000,213.2000]) color("#00c6d1") import("../parts/Head_Ear_Ring_L.stl");
translate([-60.4500,1.0000,217.6000]) color("#1a1e26") import("../parts/Head_Ear_Centre_L.stl");
translate([54.2500,1.0000,209.5000]) color("#33383d") import("../parts/Head_Ear_Pad_R.stl");
translate([58.1000,1.0000,213.2000]) color("#00c6d1") import("../parts/Head_Ear_Ring_R.stl");
translate([60.4500,1.0000,217.6000]) color("#1a1e26") import("../parts/Head_Ear_Centre_R.stl");
translate([51.5000,7.0000,239.5000]) color("#bf2d2b") import("../parts/Physical_Camera_Privacy_Switch.stl");
translate([0.0000,8.1000,196.0000]) color("#0a5638") import("../parts/Pi5_PCB_Envelope_85x56.stl");
translate([0.0000,-2.0000,207.0000]) color("#33383d") import("../parts/Pi5_Active_Cooler_Envelope.stl");
translate([0.0000,25.0000,200.0000]) color("#3a4754") import("../parts/Head_Battery_Envelope_78x10x32.stl");
translate([31.0000,15.5000,188.5000]) color("#33383d") import("../parts/Speaker_3W_Envelope.stl");
translate([0.0000,17.0000,247.0000]) color("#0a5638") import("../parts/Microphone_Array_PCB_Envelope.stl");
translate([0.0000,0.0000,184.4000]) color("#33383d") import("../parts/Head_Dock_Contact_Carrier.stl");
translate([-9.0000,-6.0000,184.4000]) color("#db9b28") import("../parts/Head_Dock_Contact_1.stl");
translate([-3.0000,-6.0000,184.4000]) color("#db9b28") import("../parts/Head_Dock_Contact_2.stl");
translate([3.0000,-6.0000,184.4000]) color("#db9b28") import("../parts/Head_Dock_Contact_3.stl");
translate([9.0000,-6.0000,184.4000]) color("#db9b28") import("../parts/Head_Dock_Contact_4.stl");
translate([0.0000,-0.3702,115.0000]) color("#babfbf") import("../parts/Torso_Shell.stl");
translate([0.0000,-26.1000,127.5000]) color("#a0a8ad") import("../parts/Torso_Chest_Insert.stl");
translate([0.0000,-27.1000,149.6000]) color("#19eaef") import("../parts/Body_Status_LED.stl");
translate([0.0000,0.0000,165.0000]) color("#33383d") import("../parts/Neck_Riser.stl");
translate([0.0000,0.0000,178.0000]) color("#1a1e26") import("../parts/Dock_Puck.stl");
translate([0.0000,0.0000,182.0000]) color("#06080b") import("../parts/Dock_Contact_Plate.stl");
translate([-9.0000,-6.0000,182.8000]) color("#db9b28") import("../parts/Body_Pogo_Pin_1.stl");
translate([-3.0000,-6.0000,182.8000]) color("#db9b28") import("../parts/Body_Pogo_Pin_2.stl");
translate([3.0000,-6.0000,182.8000]) color("#db9b28") import("../parts/Body_Pogo_Pin_3.stl");
translate([9.0000,-6.0000,182.8000]) color("#db9b28") import("../parts/Body_Pogo_Pin_4.stl");
translate([-15.0000,0.0000,179.5000]) color("#a0a8ad") import("../parts/Dock_Key_Left.stl");
translate([15.0000,0.0000,179.5000]) color("#a0a8ad") import("../parts/Dock_Key_Right.stl");
translate([0.0000,9.0000,128.0000]) color("#0a5638") import("../parts/ESP32_Controller_Envelope.stl");
translate([0.0000,18.0000,122.0000]) color("#3a4754") import("../parts/Body_Battery_Envelope_55x10x24.stl");
translate([-31.0000,2.0000,17.0000]) color("#1a1e26") import("../parts/Structural_Leg_L.stl");
translate([-31.0000,-9.8000,30.0000]) color("#33383d") import("../parts/Leg_Front_Inlay_L.stl");
translate([-31.0000,0.0000,0.0000]) color("#1a1e26") import("../parts/Foot_Housing_L.stl");
translate([-31.0000,0.0000,1.5000]) color("#00c6d1") import("../parts/Foot_Tread_Accent_L.stl");
translate([-31.0000,0.0000,14.7000]) color("#33383d") import("../parts/Foot_Top_Cover_L.stl");
translate([31.0000,2.0000,17.0000]) color("#1a1e26") import("../parts/Structural_Leg_R.stl");
translate([31.0000,-9.8000,30.0000]) color("#33383d") import("../parts/Leg_Front_Inlay_R.stl");
translate([31.0000,0.0000,0.0000]) color("#1a1e26") import("../parts/Foot_Housing_R.stl");
translate([31.0000,0.0000,1.5000]) color("#00c6d1") import("../parts/Foot_Tread_Accent_R.stl");
translate([31.0000,0.0000,14.7000]) color("#33383d") import("../parts/Foot_Top_Cover_R.stl");

// ARTICULATED ARMS + GRIPPERS
arm(-1,left_shoulder,left_elbow,jaw);
arm(1,right_shoulder,right_elbow,jaw);
