---
description: "Start WinOJ server, wait for ready, login as admin, return JWT token. Use after server is stopped."
agent: main
---

# winOj-server

Start the WinOJ backend server, wait until it responds, login as admin, and return the JWT token for subsequent API calls.

## Steps

1. **Kill any existing process on port 3000:**
   ```powershell
   $proc = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -First 1; if ($proc) { taskkill /PID $proc.OwningProcess /F }
   ```

2. **Start the server in background:**
   ```powershell
   Start-Process -FilePath "node" -ArgumentList "src/server.js" -WorkingDirectory "D:\Desktop\winoj\mimo\backend" -WindowStyle Hidden
   ```

3. **Wait for server to be ready** (poll up to 10 seconds):
   ```powershell
   $ready = $false; for ($i=0; $i -lt 20; $i++) { Start-Sleep -Milliseconds 500; try { Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"admin123"}' -ErrorAction Stop | Out-Null; $ready = $true; break } catch {} }; if (-not $ready) { Write-Host "ERROR: Server failed to start"; exit 1 }
   ```

4. **Login and capture token:**
   ```powershell
   $login = Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/v1/auth/login" -ContentType "application/json" -Body '{"username":"admin","password":"admin123"}'
   $token = $login.accessToken
   Write-Host "Server ready. Token: $token"
   ```

## Stopping

Use `stop.bat` or:
```powershell
$proc = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -First 1; if ($proc) { taskkill /PID $proc.OwningProcess /F }
```
