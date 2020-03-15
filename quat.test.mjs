import glmatrix from 'gl-matrix';

// cables
const rotation1 = [
    180,    // x
    0,      // y
    180,    // z
]

// short
const rotation2 = [
    15.7607,    // x
    0.3798,     // y
    209.03,     // z
]

// site
const rotation3 = [
    -16,    // x
    0,      // y
    0,      // z
]

// pit
const rotation4 = [
    0,      // x
    -20.5,  // y
    90,     // z
]

// bag
const rotation5 = [
    0,      // x
    -90,  // y
    45,     // z
]

function tranform(vec) {
    return [
        vec[1],
        -vec[0],
        vec[2],
    ]
}

function eulerDegreeToQuaternion([ roll, pitch, yaw ]) { // [ x, y, z ]

    roll = roll * (Math.PI / 180);
    pitch = pitch * (Math.PI / 180);
    yaw = yaw * (Math.PI / 180);

    // Abbreviations for the various angular functions
    const cy = Math.cos(yaw * 0.5);
    const sy = Math.sin(yaw * 0.5);
    const cp = Math.cos(pitch * 0.5);
    const sp = Math.sin(pitch * 0.5);
    const cr = Math.cos(roll * 0.5);
    const sr = Math.sin(roll * 0.5);

    let q = {};
    q.w = cy * cp * cr + sy * sp * sr;
    q.x = cy * cp * sr - sy * sp * cr;
    q.y = sy * cp * sr + cy * sp * cr;
    q.z = sy * cp * cr - cy * sp * sr;

    return [
        Math.floor(q.x * 100000) / 100000, 
        Math.floor(q.y * 100000) / 100000, 
        Math.floor(q.z * 100000) / 100000, 
        Math.floor(q.w * 100000) / 100000,
    ];
}

console.log('Tests:');

console.log("cables");
console.log(rotation1);
console.log(eulerDegreeToQuaternion(tranform(rotation1)));
console.log("short");
console.log(rotation2);
console.log(eulerDegreeToQuaternion(tranform(rotation2)));
console.log("site");
console.log(rotation3);
console.log(eulerDegreeToQuaternion(tranform(rotation3)));
console.log("pit");
console.log(rotation4);
console.log(eulerDegreeToQuaternion(tranform(rotation4)));
console.log("bag");
console.log(rotation5);
console.log(eulerDegreeToQuaternion(tranform(rotation5)));
