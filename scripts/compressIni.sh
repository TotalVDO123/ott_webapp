# This script cleans up the ini file to remove comments and whitespace, so it only keeps the actual data
# Remove lines that are solely comments with optional leading whitespace
sed '/^[[:blank:]]*;/d' "$1" |
# Remove any comments that come after values
sed 's/;.*//' |
# Delete blank lines
sed '/^$/d' |
# Remove whitespace around the equals signs
sed 's/[[:blank:]]*=[[:blank:]]/=/' > "$1.tmp.ini"

mv "$1.tmp.ini" "$1"
