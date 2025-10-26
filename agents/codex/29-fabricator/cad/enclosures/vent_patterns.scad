// Ventilation patterns for laser cutting
module hex_vent(cols=5, rows=5, spacing=8, radius=2) {
    for (x = [0:cols-1])
        for (y = [0:rows-1])
            translate([x*spacing + (y%2)*spacing/2, y*spacing*0.866])
                circle(r=radius, $fn=6);
}

hex_vent();
