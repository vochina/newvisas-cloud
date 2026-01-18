#!/bin/bash
# Upload only homepage-required images to R2 bucket

BUCKET_NAME="newvisas-bucket"
SOURCE_DIR="/Users/alejandro/Code/Archive/newvisas-asp/Mrevisa"

# List of images needed for homepage
images=(
    # Country flags (guojia)
    "attached/image/201401/20140102175235643564.jpg"
    "attached/image/201401/201401031630007878.jpg"
    "attached/image/201401/2014010316260997997.jpg"
    "attached/image/201401/20140103162829932993.jpg"
    "attached/image/201401/20140116172726552655.jpg"
    "attached/image/201605/20160505153387088708.jpg"
    "attached/image/201401/20140103161488718871.jpg"
    "attached/image/201401/20140117163220822082.png"
    "attached/image/201403/20140307161177107710.jpg"
    "attached/image/201401/20140116170583888388.png"
    
    # Project images (xm)
    "attached/image/201605/20160505164227302730.png"
    "attached/image/201604/20160414150572217221.jpg"
    "attached/image/201512/20151216092818441844.jpg"
    "attached/image/201504/20150401150954445444.png"
    "attached/image/201501/20150123094986328632.png"
    "attached/image/201501/20150113141314321432.jpg"
    
    # Ad/Banner images
    "attached/image/201604/20160415112851075107.png"
    "attached/image/201406/20140620101318711871.jpg"
    "attached/image/201607/2016070516180343343.jpg"
    "attached/image/201702/20170222143875277527.jpg"
    "attached/image/201812/20181225114822882288.jpg"
    
    # Also found on homepage
    "attached/image/201812/201812251153007272.jpg"
)

echo "Uploading homepage images to R2..."
uploaded=0
for img in "${images[@]}"; do
    if [ -f "$SOURCE_DIR/$img" ]; then
        echo "Uploading: $img"
        npx wrangler r2 object put "$BUCKET_NAME/$img" --file="$SOURCE_DIR/$img" 2>/dev/null
        uploaded=$((uploaded + 1))
    else
        echo "WARNING: File not found: $SOURCE_DIR/$img"
    fi
done

echo "Done! $uploaded images uploaded."
