# Quick deploy aliases for faster iteration
alias qd='npm run qd'
alias gac='git add -A && git commit -m'
alias gacp='git add -A && git commit -m "quick fix" && git push'
alias deploy='npm run qd'

# Combined operations
alias ship='git add -A && git commit -m "quick update" && npm run qd'