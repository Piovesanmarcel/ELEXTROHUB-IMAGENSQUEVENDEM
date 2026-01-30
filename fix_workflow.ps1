# Script final - remove propriedades extras
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhNWYzNjU4Yi1hOTEzLTQxYjYtOGIwZS1iZjNmMDgyNTNhYTMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY5NDkxNzM4LCJleHAiOjE3NzIwNzQ4MDB9.7Lx62VCVvQwmbzCkBrx6_h4AguNybaH-4-OT8vnYgTA"
$workflowId = "jUOrsahC4a8afS8p"
$baseUrl = "https://n8n.visualvendas.cloud/api/v1/workflows"
$headers = @{"X-N8N-API-KEY"=$apiKey}

Write-Host "[INFO] Baixando workflow..."
$workflow = Invoke-RestMethod -Uri "$baseUrl/$workflowId" -Method GET -Headers $headers -ContentType "application/json"

Write-Host "[INFO] Workflow: $($workflow.name), Nos: $($workflow.nodes.Count)"

$fixes = 0

# Correcao 1: Redis REQUEUE nodes - messageData
foreach ($node in $workflow.nodes) {
    if ($node.name -like "*REQUEUE*" -and $node.parameters.messageData -eq "image_generation_queue") {
        Write-Host "[FIX] $($node.name) - messageData"
        $node.parameters.messageData = "={{ JSON.stringify(`$json) }}"
        $fixes++
    }
}

# Correcao 2: IF Validar Job Simples - leftValue
foreach ($node in $workflow.nodes) {
    if ($node.name -like "*Validar Job Simples*" -and $node.parameters.conditions) {
        foreach ($cond in $node.parameters.conditions.conditions) {
            if ($cond.leftValue -and $cond.leftValue.EndsWith("`n")) {
                Write-Host "[FIX] $($node.name) - newline"
                $cond.leftValue = $cond.leftValue.TrimEnd("`n")
                $fixes++
            }
        }
    }
}

# Correcao 3: Schedule Trigger1 connection
$stConn = $workflow.connections.'Schedule Trigger1'
if ($stConn -and $stConn.main -and $stConn.main.Count -gt 0 -and $stConn.main[0].Count -eq 0) {
    Write-Host "[FIX] Schedule Trigger1 -> Redis SET TTL do lock"
    $newConn = [PSCustomObject]@{
        node = "Redis SET TTL do lock"
        type = "main"
        index = 0
    }
    $workflow.connections.'Schedule Trigger1'.main[0] = @($newConn)
    $fixes++
}

Write-Host "[INFO] Correcoes: $fixes"

if ($fixes -eq 0) {
    Write-Host "[WARN] Nada a corrigir"
    exit 0
}

# Limpar nos - manter apenas propriedades validas
$cleanNodes = @()
foreach ($node in $workflow.nodes) {
    $cleanNode = @{
        name = $node.name
        type = $node.type
        typeVersion = $node.typeVersion
        position = $node.position
        parameters = $node.parameters
    }
    
    # Adicionar id se existir
    if ($node.id) { $cleanNode.id = $node.id }
    
    # Adicionar credentials se existir
    if ($node.credentials) { $cleanNode.credentials = $node.credentials }
    
    # Adicionar webhookId se existir
    if ($node.webhookId) { $cleanNode.webhookId = $node.webhookId }
    
    # Adicionar outros campos opcionais
    if ($null -ne $node.alwaysOutputData) { $cleanNode.alwaysOutputData = $node.alwaysOutputData }
    if ($null -ne $node.executeOnce) { $cleanNode.executeOnce = $node.executeOnce }
    if ($null -ne $node.retryOnFail) { $cleanNode.retryOnFail = $node.retryOnFail }
    if ($node.onError) { $cleanNode.onError = $node.onError }
    if ($null -ne $node.continueOnFail) { $cleanNode.continueOnFail = $node.continueOnFail }
    if ($node.notes) { $cleanNode.notes = $node.notes }
    if ($null -ne $node.disabled) { $cleanNode.disabled = $node.disabled }
    
    $cleanNodes += [PSCustomObject]$cleanNode
}

# Limpar settings
$cleanSettings = @{
    executionOrder = $workflow.settings.executionOrder
}
if ($workflow.settings.callerPolicy) {
    $cleanSettings.callerPolicy = $workflow.settings.callerPolicy
}

# Payload minimo
$updatePayload = @{
    name = $workflow.name
    nodes = $cleanNodes
    connections = $workflow.connections
    settings = $cleanSettings
}

Write-Host "[INFO] Enviando..."
$body = $updatePayload | ConvertTo-Json -Depth 100 -Compress
$body | Out-File "workflow_fixed.json" -Encoding UTF8 -Force
Write-Host "[INFO] Payload: $($body.Length) bytes"

try {
    $result = Invoke-RestMethod -Uri "$baseUrl/$workflowId" -Method PUT -Headers $headers -ContentType "application/json; charset=utf-8" -Body ([System.Text.Encoding]::UTF8.GetBytes($body))
    Write-Host "[SUCCESS] Atualizado! ID=$($result.id) Version=$($result.versionId)"
} catch {
    Write-Host "[ERROR] HTTP $($_.Exception.Response.StatusCode.value__)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        Write-Host "[DEBUG] $($reader.ReadToEnd())"
    }
}
