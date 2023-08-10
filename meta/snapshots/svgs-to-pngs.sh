#!/bin/bash

for file in svg/*.svg
  do
    filename="${file##*/}"
    basename="${filename%.*}"
    inkscape -w 9300 -h 7750 svg/${basename}.svg -o big-png/${basename}.png
    inkscape -w 6600 -h 9900 svg/${basename}.svg -o big-png/${basename}-2x3.png
    inkscape -w 14579 -h 5700 svg/${basename}.svg -o big-png/${basename}-tapestry.png
    inkscape -w 3750 -h 10650 svg/${basename}.svg -o big-png/${basename}-tall.png
  done
