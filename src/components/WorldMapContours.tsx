/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

/**
 * WorldMapContours renders realistic continental landmasses, coastlines,
 * topographical gridlines and maritime features for the War tactical table.
 * Calibrated precisely to the 1000 x 620 coordinate space of the 42 territories.
 */
export const WorldMapContours: React.FC = () => {
  return (
    <g className="world-map-contours pointer-events-none select-none">
      {/* Graticule: Subtle Tactical Coordinates & Navigational Grid */}
      <g className="graticule opacity-[0.09]" stroke="#38bdf8" strokeWidth="0.75" strokeDasharray="3 4">
        {/* Parallels (Latitude) */}
        <line x1="20" y1="85" x2="980" y2="85" />
        <line x1="20" y1="180" x2="980" y2="180" />
        <line x1="20" y1="280" x2="980" y2="280" />
        <line x1="20" y1="380" x2="980" y2="380" />
        <line x1="20" y1="480" x2="980" y2="480" />
        <line x1="20" y1="560" x2="980" y2="560" />

        {/* Meridians (Longitude) */}
        <line x1="100" y1="40" x2="100" y2="580" />
        <line x1="240" y1="40" x2="240" y2="580" />
        <line x1="380" y1="40" x2="380" y2="580" />
        <line x1="520" y1="40" x2="520" y2="580" />
        <line x1="660" y1="40" x2="660" y2="580" />
        <line x1="800" y1="40" x2="800" y2="580" />
        <line x1="920" y1="40" x2="920" y2="580" />
      </g>

      {/* Cartographic Compass Rose (Atlantic Ocean) */}
      <g transform="translate(365, 345)" opacity="0.16">
        <circle r="28" fill="none" stroke="#e2e8f0" strokeWidth="0.75" strokeDasharray="2 3" />
        <circle r="18" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
        <path d="M0,-26 L3,-7 L0,0 L-3,-7 Z" fill="#f8fafc" />
        <path d="M0,26 L3,7 L0,0 L-3,7 Z" fill="#94a3b8" />
        <path d="M26,0 L7,3 L0,0 L7,-3 Z" fill="#94a3b8" />
        <path d="M-26,0 L-7,3 L0,0 L-7,-3 Z" fill="#94a3b8" />
        <text x="0" y="-30" textAnchor="middle" fill="#f8fafc" fontSize="7" fontWeight="bold">N</text>
      </g>

      {/* CONTINENT 1: NORTH AMERICA */}
      <g id="landmass-north-america">
        {/* Coastal Shelf Glow */}
        <path
          d="M 50,115 C 45,90 80,60 140,55 C 200,50 250,55 300,75 C 310,65 345,55 365,70 C 375,95 340,120 300,125 C 290,140 310,175 285,195 C 265,210 245,260 215,280 C 195,300 185,340 160,355 C 145,340 145,305 130,285 C 110,265 110,200 80,180 C 50,165 45,135 50,115 Z"
          fill="#1e293b"
          opacity="0.25"
          filter="blur(4px)"
        />
        {/* Main Solid Landmass */}
        <path
          d="M 55,115 C 50,95 85,65 145,60 C 195,55 240,60 280,75 C 290,95 260,115 220,120 C 230,135 285,145 280,185 C 255,195 240,245 220,265 C 200,285 185,325 168,340 C 155,335 155,300 140,280 C 120,250 115,195 90,175 C 65,160 55,135 55,115 Z"
          fill="#172554"
          fillOpacity="0.45"
          stroke="#38bdf8"
          strokeWidth="1.2"
          strokeOpacity="0.35"
        />
        {/* Greenland Island */}
        <path
          d="M 295,75 C 305,50 345,45 360,65 C 370,85 345,115 320,120 C 300,120 290,95 295,75 Z"
          fill="#172554"
          fillOpacity="0.5"
          stroke="#38bdf8"
          strokeWidth="1.2"
          strokeOpacity="0.4"
        />
      </g>

      {/* CONTINENT 2: SOUTH AMERICA */}
      <g id="landmass-south-america">
        {/* Coastal Shelf Glow */}
        <path
          d="M 180,360 C 220,345 270,350 310,380 C 345,410 335,465 290,500 C 270,525 260,575 235,595 C 215,575 200,535 190,480 C 175,435 170,380 180,360 Z"
          fill="#064e3b"
          opacity="0.25"
          filter="blur(4px)"
        />
        {/* Main Solid Landmass */}
        <path
          d="M 190,365 C 225,350 265,355 300,385 C 335,415 325,460 280,495 C 260,520 250,565 230,580 C 215,560 205,520 195,475 C 185,435 180,385 190,365 Z"
          fill="#064e3b"
          fillOpacity="0.4"
          stroke="#34d399"
          strokeWidth="1.2"
          strokeOpacity="0.35"
        />
      </g>

      {/* CONTINENT 3: EUROPE */}
      <g id="landmass-europe">
        {/* Iceland */}
        <path
          d="M 395,105 C 405,95 435,95 435,115 C 425,125 405,125 395,105 Z"
          fill="#1e1b4b"
          fillOpacity="0.45"
          stroke="#818cf8"
          strokeWidth="1"
          strokeOpacity="0.4"
        />
        {/* Great Britain & Ireland */}
        <path
          d="M 395,170 C 405,160 425,165 425,190 C 415,205 395,205 395,170 Z"
          fill="#1e1b4b"
          fillOpacity="0.45"
          stroke="#818cf8"
          strokeWidth="1"
          strokeOpacity="0.4"
        />
        {/* Scandinavia & Continental Europe */}
        <path
          d="M 440,165 C 465,130 505,125 520,160 C 510,185 475,185 460,205 C 485,215 510,230 495,270 C 475,275 450,285 435,270 C 415,260 420,225 440,205 C 445,190 435,175 440,165 Z"
          fill="#1e1b4b"
          fillOpacity="0.4"
          stroke="#818cf8"
          strokeWidth="1.2"
          strokeOpacity="0.35"
        />
        {/* Eastern Europe / Russia European flank */}
        <path
          d="M 520,150 C 540,135 580,135 605,160 C 600,195 565,225 540,230 C 525,205 510,175 520,150 Z"
          fill="#1e1b4b"
          fillOpacity="0.35"
          stroke="#818cf8"
          strokeWidth="1.2"
          strokeOpacity="0.3"
        />
      </g>

      {/* CONTINENT 4: AFRICA */}
      <g id="landmass-africa">
        {/* Coastal Shelf Glow */}
        <path
          d="M 430,340 C 470,320 540,320 575,350 C 610,380 615,445 570,490 C 555,530 545,565 525,580 C 500,565 490,520 480,480 C 460,450 425,410 420,370 C 415,350 420,340 430,340 Z"
          fill="#831843"
          opacity="0.25"
          filter="blur(4px)"
        />
        {/* Main Solid Landmass */}
        <path
          d="M 435,345 C 475,325 535,325 565,350 C 600,380 605,440 565,480 C 550,520 540,555 525,570 C 505,555 495,510 485,475 C 465,445 435,410 430,375 C 425,355 430,345 435,345 Z"
          fill="#701a75"
          fillOpacity="0.4"
          stroke="#f472b6"
          strokeWidth="1.2"
          strokeOpacity="0.35"
        />
        {/* Madagascar Island */}
        <path
          d="M 615,495 C 625,485 640,495 635,535 C 625,550 615,535 615,495 Z"
          fill="#701a75"
          fillOpacity="0.45"
          stroke="#f472b6"
          strokeWidth="1"
          strokeOpacity="0.4"
        />
      </g>

      {/* CONTINENT 5: ASIA */}
      <g id="landmass-asia">
        {/* Siberian & Arctic Coastline */}
        <path
          d="M 610,150 C 640,95 720,85 790,85 C 840,80 890,90 920,115 C 910,145 860,165 830,195 C 810,230 800,285 760,335 C 725,350 670,335 650,295 C 635,270 590,265 570,240 C 585,215 595,175 610,150 Z"
          fill="#431407"
          fillOpacity="0.4"
          stroke="#fb923c"
          strokeWidth="1.2"
          strokeOpacity="0.35"
        />
        {/* Indian Subcontinent Peninsula */}
        <path
          d="M 650,285 C 685,280 705,305 690,345 C 675,370 660,360 645,325 C 640,300 645,290 650,285 Z"
          fill="#431407"
          fillOpacity="0.45"
          stroke="#fb923c"
          strokeWidth="1"
          strokeOpacity="0.35"
        />
        {/* Southeast Asia Peninsula */}
        <path
          d="M 755,325 C 785,325 805,340 795,385 C 780,395 765,375 755,345 Z"
          fill="#431407"
          fillOpacity="0.45"
          stroke="#fb923c"
          strokeWidth="1"
          strokeOpacity="0.35"
        />
        {/* Japan Archipelago */}
        <path
          d="M 875,220 C 895,210 900,235 885,265 C 875,260 870,235 875,220 Z"
          fill="#431407"
          fillOpacity="0.5"
          stroke="#fb923c"
          strokeWidth="1"
          strokeOpacity="0.45"
        />
      </g>

      {/* CONTINENT 6: OCEANIA / AUSTRALIA */}
      <g id="landmass-oceania">
        {/* Indonesian Archipelago Islands */}
        <path
          d="M 755,420 C 780,410 820,425 810,445 C 785,445 765,435 755,420 Z"
          fill="#3b0764"
          fillOpacity="0.45"
          stroke="#c084fc"
          strokeWidth="1"
          strokeOpacity="0.4"
        />
        {/* New Guinea Island */}
        <path
          d="M 855,410 C 885,405 910,420 895,445 C 870,445 855,425 855,410 Z"
          fill="#3b0764"
          fillOpacity="0.45"
          stroke="#c084fc"
          strokeWidth="1"
          strokeOpacity="0.4"
        />
        {/* Australia Mainland */}
        <path
          d="M 770,480 C 815,465 870,465 910,490 C 925,525 905,565 865,570 C 820,575 780,555 765,525 C 760,505 765,490 770,480 Z"
          fill="#3b0764"
          fillOpacity="0.4"
          stroke="#c084fc"
          strokeWidth="1.2"
          strokeOpacity="0.35"
        />
        {/* New Zealand */}
        <path
          d="M 935,540 C 945,530 955,545 945,570 C 935,565 930,550 935,540 Z"
          fill="#3b0764"
          fillOpacity="0.4"
          stroke="#c084fc"
          strokeWidth="1"
          strokeOpacity="0.3"
        />
      </g>

      {/* Convoy Maritime Routes (Historical Sea Lines) */}
      <g className="sea-routes" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="3 4" opacity="0.22">
        {/* North Atlantic: New York to Great Britain */}
        <path d="M 230,235 Q 315,190 405,185" fill="none" />
        {/* South Atlantic: Brazil to North Africa */}
        <path d="M 300,435 Q 380,400 455,365" fill="none" />
        {/* Mediterranean to Middle East / India */}
        <path d="M 545,345 Q 610,320 670,295" fill="none" />
        {/* Pacific: California to Australia */}
        <path d="M 145,245 Q 400,500 870,470" fill="none" />
      </g>
    </g>
  );
};
