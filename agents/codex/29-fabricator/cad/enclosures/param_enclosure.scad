// Parametric enclosure template for Fabricator line
module enclosure(length=100, width=60, height=30, wall=3) {
    difference() {
        cube([length, width, height], center=false);
        translate([wall, wall, wall]) cube([length-2*wall, width-2*wall, height-wall]);
    }
}

enclosure();
