const MAX_DISP_CORNER_NEIGHBORS = 4;

export const BSP = {
    
    dheader_t: {
        ident: 'byte[4]',
        version: 'int',
        lumps: 'lump_t[HEADER_LUMPS]',
        mapRevision: 'int',
    },
    lump_t: {
        fileofs: 'int',
        filelen: 'int',
        version: 'int',
        fourCC: 'byte[4]',
    },
    dplane_t: {
        normal: 'vector',
        dist: 'float',
        type: 'int'
    },
    dface_t: {
        planenum: 'unsigned short',
        side: 'byte',
        onNode: 'byte',
        firstedge: 'int',
        numedges: 'short',
        texinfo: 'short',
        dispinfo: 'short',
        surfaceFogVolumeID: 'short',
        styles: 'byte[4]',
        lightofs: 'int',
        area: 'float',
        LightmapTextureMinsInLuxels: 'int[2]',
        LightmapTextureSizeInLuxels: 'int[2]',
        origFace: 'int',
        numPrims: 'unsigned short',
        firstPrimID: 'unsigned short',
        smoothingGroups: 'unsigned int',
    },
    vertex: {
        x: 'float',
        y: 'float',
        z: 'float',
    },
    dedge_t: {
        v: 'unsigned short[2]'
    },
    surfedge: {
        v: 'int'
    },
    dbrush_t: {
        firstside: 'int',
        numsides: 'int',
        contents: 'int',
    },
    dbrushside_t: {
        planenum:'unsigned short',
        texinfo: 'short',
        dispinfo: 'short',
        bevel: 'short',
    },
    dnode_t: {
        planenum: 'int',
        children: 'int',
        mins: 'short',
        maxs: 'short',
        firstface: 'unsigned short',
        numfaces: 'unsigned short',
        area: 'short',
        paddding: 'short',
    },
    dleaf_t: {
        contents: 'int',
        cluster: 'short',
        area: 'short:9',
        flags: 'short:7',
        mins: 'int[3]',
        maxs: 'int[3]',
        firstleafface: 'unsigned short',
        numleaffaces: 'unsigned short',
        firstleafbrush: 'unsigned short',
        numleafbrushes: 'unsigned short',
        leafWaterDataID: 'short',
    },
    texinfo_t: {
        textureVecs: 'float[2][4]',
        lightmapVecs: 'float[2][4]',
        flags: 'int',
        texdata: 'int',
    },
    dtexdata_t: {
        reflectivity: 'vector',
        nameStringTableID: 'int',
        width_height: 'int, int',
        view_width_view_height: 'int, int'
    },
    dmodel_t: {
        mins: 'vector',
        maxs: 'vector',
        origin: 'vector',
        headnode: 'int',
        firstface: 'int',
        numfaces: 'int'
    },
    ddispinfo_t: {
        startPosition: 'vector',
        DispVertStart: 'int',
        DispTriStart: 'int',
        power: 'int',
        minTess: 'int',
        smoothingAngle: 'float',
        contents: 'int',
        MapFace: 'unsigned short',
        LightmapAlphaStart: 'int',
        LightmapSamplePositionStart: 'int',
        neighbors: 'byte[90]',
        AllowedVerts: 'unsigned int[10]',
    },
    CDispNeighbor: {
        m_SubNeighbors: 'CDispSubNeighbor[2]',
    },
    CDispSubNeighbor: {
        m_iNeighbor: 'unsigned short',
        m_NeighborOrientation: 'byte',
        m_Span: 'byte',
        m_NeighborSpan: 'byte',
    },
    CDispCornerNeighbors: {
        m_Neighbors: `unsigned short[${MAX_DISP_CORNER_NEIGHBORS}]`,
        m_nNeighbors: 'byte',
    },
    dDispVert: {
        vec: 'vector',
        dist: 'float',
        alpha: 'float',
    },
    dDispTri: {
        Tags: 'unsigned short'
    },
    dgamelumpheader_t: {
        lumpCount: 'int',
        gamelump: 'dgamelump_t[lumpCount]',
    },
    dgamelump_t: {
        id: 'int',
        flags: 'unsigned short',
        version: 'unsigned short',
        fileofs: 'int',
        filelen: 'int',
    },
    StaticPropDictLump_t: {
        dictEntries: 'int',
        name: 'char[dictEntries][128]'
    },
    StaticPropLeafLump_t: {
        leafEntries: 'int',
        leaf: 'unsigned short[leafEntries]'
    },
    qangle: {
        0: 'float',
        1: 'float',
        2: 'float',
    },
    StaticPropLumpV5_t: {
        Origin: 'vector',
        Angles: 'qangle',
        PropType: 'unsigned short',
        FirstLeaf: 'unsigned short',
        LeafCount: 'unsigned short',
        Solid: 'byte',
        Flags: 'byte',
        Skin: 'int',
        FadeMinDist: 'float',
        FadeMaxDist: 'float',
        LightingOrigin: 'vector',
        ForcedFadeScale: 'float',
    },
    StaticPropLumpV6_t: {
        Origin: 'vector',
        Angles: 'qangle',
        PropType: 'unsigned short',
        FirstLeaf: 'unsigned short',
        LeafCount: 'unsigned short',
        Solid: 'byte',
        Flags: 'byte',
        Skin: 'int',
        FadeMinDist: 'float',
        FadeMaxDist: 'float',
        LightingOrigin: 'vector',
        ForcedFadeScale: 'float',
        
        not_used: 'byte[4]',
    },
    StaticPropLumpV10_t: {
        Origin: 'vector',
        Angles: 'qangle',
        PropType: 'unsigned short',
        FirstLeaf: 'unsigned short',
        LeafCount: 'unsigned short',
        Solid: 'byte',
        Flags: 'byte',
        Skin: 'int',
        FadeMinDist: 'float',
        FadeMaxDist: 'float',
        LightingOrigin: 'vector',
        ForcedFadeScale: 'float',
        
        not_used: 'byte[16]',
    },
    StaticPropLumpV11_t: {
        Origin: 'vector',
        Angles: 'qangle',
        PropType: 'unsigned short',
        FirstLeaf: 'unsigned short',
        LeafCount: 'unsigned short',
        Solid: 'byte',
        Flags: 'byte',
        Skin: 'int',
        FadeMinDist: 'float',
        FadeMaxDist: 'float',
        LightingOrigin: 'vector',
        ForcedFadeScale: 'float',
        
        not_used: 'byte[16]',
        // match:

        // MinCPULevel: 'byte',
        // MaxCPULevel: 'byte',
        // MinGPULevel: 'byte',
        // MaxGPULevel: 'byte',
        // DiffuseModulation: 'color32',
        // DisableX360: 'int',
        // FlagsEx: 'unsigned int',

        UniformScale: 'float',
    }
}

export const Entity = {
    sky_camera: 'sky_camera',
    prop_dynamic: 'prop_dynamic',
    prop_physics_multiplayer: 'prop_physics_multiplayer',
    info_player_terrorist: 'info_player_terrorist',
    info_player_counterterrorist: 'info_player_counterterrorist',
    keyframe_rope: 'keyframe_rope',
    move_rope: 'move_rope',
    prop_door_rotating: 'prop_door_rotating',
    light_spot: 'light_spot',
    light: 'light',
    info_particle_system: 'info_particle_system',
    info_overlay: 'info_overlay',
    func_detail: 'func_detail',
    func_breakable: 'func_breakable',
    func_illusionary: 'func_illusionary',
    func_brush: 'func_brush',
    env_sprite: 'env_sprite',
}

export const TextureFlags = {
    SURF_LIGHT: 0x1,
    SURF_SKY2D: 0x2,
    SURF_SKY: 0x4,
    SURF_WARP: 0x8,
    SURF_TRANS: 0x10,
    SURF_NOPORTAL: 0x20,
    SURF_TRIGGER: 0x40,
    SURF_NODRAW: 0x80,
    SURF_HINT: 0x100,
    SURF_SKIP: 0x200,
    SURF_NOLIGHT: 0x400,
    SURF_BUMPLIGHT: 0x800,
    SURF_NOSHADOWS: 0x1000,
    SURF_NODECALS: 0x2000,
    SURF_NOCHOP: 0x4000,
    SURF_HITBOX: 0x8000,
}

export const LumpTypes = {
    ENTITIES: 0,
    PLANES: 1,
    TEXDATA: 2,
    VERTEXES: 3,
    VISIBILITY: 4,
    NODES: 5,
    TEXINFO: 6,
    FACES: 7,
    LIGHTING: 8,
    OCCLUSION: 9,
    LEAFS: 10,
    FACEIDS: 11,
    EDGES: 12,
    SURFEDGES: 13,
    MODELS: 14,
    WORLDLIGHTS: 15,
    LEAFFACES: 16,
    LEAFBRUSHES: 17,
    BRUSHES: 18,
    BRUSHSIDES: 19,
    AREAS: 20,
    AREAPORTALS: 21,
    PORTALS: 22,
    UNUSED0: 22,
    PROPCOLLISION: 22,
    CLUSTERS: 23,
    UNUSED26: 23,
    PROPHULLS: 23,
    PORTALVERTS: 24,
    UNUSED2: 24,
    PROPHULLVERTS: 24,
    CLUSTERPORTALS: 25,
    UNUSED3: 25,
    PROPTRIS: 25,
    DISPINFO: 26,
    ORIGINALFACES: 27,
    PHYSDISP: 28,
    PHYSCOLLIDE: 29,
    VERTNORMALS: 30,
    VERTNORMALINDICES: 31,
    DISP_LIGHTMAP_ALPHAS: 32,
    DISP_VERTS: 33,
    DISP_LIGHTMAP_SAMPLE_POSITIONS: 34,
    GAME_LUMP: 35,
    LEAFWATERDATA: 36,
    PRIMITIVES: 37,
    PRIMVERTS: 38,
    PRIMINDICES: 39,
    PAKFILE: 40,
    CLIPPORTALVERTS: 41,
    CUBEMAPS: 42,
    TEXDATA_STRING_DATA: 43,
    TEXDATA_STRING_TABLE: 44,
    OVERLAYS: 45,
    LEAFMINDISTTOWATER: 46,
    FACE_MACRO_TEXTURE_INFO: 47,
    DISP_TRIS: 48,
    PHYSCOLLIDESURFACE: 49,
    PROP_BLOB: 49,
    WATEROVERLAYS: 50,
    LIGHTMAPPAGES: 51,
    LEAF_AMBIENT_INDEX_HDR: 51,
    LIGHTMAPPAGEINFOS: 52,
    LEAF_AMBIENT_INDEX: 52,
    LIGHTING_HDR: 53,
    WORLDLIGHTS_HDR: 54,
    LEAF_AMBIENT_LIGHTING_HDR: 55,
    LEAF_AMBIENT_LIGHTING: 56,
    XZIPPAKFILE: 57,
    FACES_HDR: 58,
    MAP_FLAGS: 59,
    OVERLAY_FADES: 60,
    OVERLAY_SYSTEM_LEVELS: 61,
    PHYSLEVEL: 62,
    DISP_MULTIBLEND: 63,
};
