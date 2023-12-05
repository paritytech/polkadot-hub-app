#!/bin/bash

echo "
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
░██╗░░██╗██╗░░░██╗██████╗░░░░░░█████╗░██████╗░██████╗░░
░██║░░██║██║░░░██║██╔══██╗░░░░██╔══██╗██╔══██╗██╔══██╗░
░███████║██║░░░██║██████╦╝░░░░███████║██████╔╝██████╔╝░
░██╔══██║██║░░░██║██╔══██╗░░░░██╔══██║██╔═══╝░██╔═══╝░░
░██║░░██║╚██████╔╝██████╦╝░░░░██║░░██║██║░░░░░██║░░░░░░
░╚═╝░░╚═╝░╚═════╝░╚═════╝░░░░░╚═╝░░╚═╝╚═╝░░░░░╚═╝░░░░░░
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░"

demo_config=false
dev_flag=false

if [ "$1" == "--demo" ]; then
    demo_config=true

elif [ "$1" == "--dev" ]; then
    dev_flag=true
fi

# Run the appropriate command based on the presence of the --demo flag
if [ "$demo_config" = true ]; then
  echo "Starting Polkadot Hub using demo docker-compose-demo.yml and ./config-demo"
  docker compose -f docker-compose-demo.yml up
elif [ "$dev_flag" = true ]; then
  echo "Starting Polkadot Hub using docker-compose-dev.yml and ./config"
  docker compose -f docker-compose-dev.yml up
else
  echo "Starting Polkadot Hub using docker-compose.yml and ./config"
  docker compose -f docker-compose.yml up
fi
