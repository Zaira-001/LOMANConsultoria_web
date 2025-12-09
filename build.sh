#!/bin/bash
set -e

echo "🔧 Installing .NET SDK..."

# Descargar e instalar .NET 9
curl -sSL https://dot.net/v1/dotnet-install.sh | bash /dev/stdin --channel 9.0 --install-dir ./dotnet

# Agregar .NET al PATH
export DOTNET_ROOT=$PWD/dotnet
export PATH=$PATH:$DOTNET_ROOT:$DOTNET_ROOT/tools

# Verificar instalación
dotnet --version

echo "✅ .NET SDK installed successfully"

echo "📦 Publishing project..."

# Publicar el proyecto
dotnet publish ProyectoWeb/ProyectoWeb.csproj -c Release -o publish

echo "✅ Project published successfully"

# Verificar que wwwroot existe
if [ -d "publish/wwwroot" ]; then
    echo "✅ wwwroot folder found"
    ls -la publish/wwwroot
else
    echo "❌ ERROR: wwwroot folder not found"
    exit 1
fi