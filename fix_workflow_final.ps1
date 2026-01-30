# Correcao final - IF Validar Job Simples
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhNWYzNjU4Yi1hOTEzLTQxYjYtOGIwZS1iZjNmMDgyNTNhYTMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY5NDkxNzM4LCJleHAiOjE3NzIwNzQ4MDB9.7Lx62VCVvQwmbzCkBrx6_h4AguNybaH-4-OT8vnYgTA"
$workflowId = "jUOrsahC4a8afS8p"
$baseUrl = "https://n8n.visualvendas.cloud/api/v1/workflows"
$headers = @{"X-N8N-API-KEY"=$apiKey}

Write-Host "[INFO] Baixando workflow..."
$workflow = Invoke-RestMethod -Uri "$baseUrl/$workflowId" -Method GET -Headers $headers -ContentType "application/json"

$fixes = 0

# Correcao: IF Validar Job Simples - propertyName.jobId -> jobId
foreach ($node in $workflow.nodes) {
    if ($node.name -like '*Validar Job*' -and $node.parameters.conditions) {
        foreach ($cond in $node.parameters.conditions.conditions) {
            if ($cond.leftValue -like "*propertyName*") {
                Write-Host "[FIX] $($node.name): propertyName.jobId -> jobId"
                $cond.leftValue = "={{ `$json.jobId }}"
                $fixes++
            }
        }
    }
}

Write-Host "[INFO] Correcoes: $fixes"

if ($fixes -eq 0) {
    Write-Host "[OK] Nada a corrigir"
    exit 0
}

# Limpar nos
$cleanNodes = @()
foreach ($node in $workflow.nodes) {
    $cleanNode = @{
        name = $node.name
        type = $node.type
        typeVersion = $node.typeVersion
        position = $node.position
        parameters = $node.parameters
    }
    if ($node.id) { $cleanNode.id = $node.id }
    if ($node.credentials) { $cleanNode.credentials = $node.credentials }
    if ($node.webhookId) { $cleanNode.webhookId = $node.webhookId }
    if ($null -ne $node.alwaysOutputData) { $cleanNode.alwaysOutputData = $node.alwaysOutputData }
    if ($null -ne $node.executeOnce) { $cleanNode.executeOnce = $node.executeOnce }
    if ($null -ne $node.retryOnFail) { $cleanNode.retryOnFail = $node.retryOnFail }
    if ($node.onError) { $cleanNode.onError = $node.onError }
    if ($null -ne $node.continueOnFail) { $cleanNode.continueOnFail = $node.continueOnFail }
    if ($node.notes) { $cleanNode.notes = $node.notes }
    if ($null -ne $node.disabled) { $cleanNode.disabled = $node.disabled }
    $cleanNodes += [PSCustomObject]$cleanNode
}

$cleanSettings = @{ executionOrder = $workflow.settings.executionOrder }
if ($workflow.settings.callerPolicy) { $cleanSettings.callerPolicy = $workflow.settings.callerPolicy }

$updatePayload = @{
    name = $workflow.name
    nodes = $cleanNodes
    connections = $workflow.connections
    settings = $cleanSettings
}

Write-Host "[INFO] Enviando..."
$body = $updatePayload | ConvertTo-Json -Depth 100 -Compress

try {
    $result = Invoke-RestMethod -Uri "$baseUrl/$workflowId" -Method PUT -Headers $headers -ContentType "application/json; charset=utf-8" -Body ([System.Text.Encoding]::UTF8.GetBytes($body))
    Write-Host "[SUCCESS] Atualizado! Version=$($result.versionId)"
} catch {
    Write-Host "[ERROR] HTTP $($_.Exception.Response.StatusCode.value__)"
}
