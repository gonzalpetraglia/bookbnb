

FLAG=$1


npm run ganache 1> /dev/null 2>/dev/null  &

truffle test $FLAG 
