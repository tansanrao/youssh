# YouSSH

A simple GUI for forwarding ports from native apps and docker containers running on remote hosts over SSH. Inspired by VSCode's port forwarding behaviour, minus the need to open multiple IDE windows for each machine. Built to make life simpler when developing on multiple remote hosts with multiple services. Can also be used if you ,like me, cannot ever remember the ssh port forwarding syntax.

## Features
- Connect to Hosts in the `~/.ssh/config` file
- Index Ports listening on remote hosts
- Forward Remote Ports to localhost

## Todo
- [ ] Don't hang when something fails 🙃
- [ ] Active Processes UI
- [ ] nvidia-smi data in UI
- [ ] Forward a port that is not currently bound
- [ ] Connect to hosts with a wildcard in ssh config
- [ ] SSH Filesystem to allow mounting remote dirs
- [ ] App Config Persistence and App state management
- [ ] OS Toolbar Widget
- [ ] Better Logging and Log Viewer in UI
- [ ] Open in Terminal, Iterm2, VSCode
- [ ] SSH Config snippet generator

## Installation

It should work fine on MacOS, tested with Monterey on Intel-based Mac. Please raise an issue if any trouble during install/use.
Requires `nc` and `ssh` on the local machine and `lsof` or `netstat` on the remote machines.

### How To Install
1. Make sure netcat is installed `brew install netcat`
2. Download the dmg from the releases tab and drag the app into Applications.