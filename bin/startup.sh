tmux new-session -s 'hamtube' 'yarn server-dev' \; \
  split-window 'yarn client-dev' \; \
  split-window \; \
  select-layout tiled \; \