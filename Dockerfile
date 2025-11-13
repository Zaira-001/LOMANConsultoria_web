# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copiar archivos de proyecto
COPY ["WebAPI/WebAPI.csproj", "WebAPI/"]
COPY ["BIZ/BIZ.csproj", "BIZ/"]
COPY ["COMMON/COMMON.csproj", "COMMON/"]
COPY ["DAL/DAL.csproj", "DAL/"]
COPY ["ProyectoWeb/ProyectoWeb.csproj", "ProyectoWeb/"]

# Restaurar dependencias
RUN dotnet restore "WebAPI/WebAPI.csproj"

# Copiar todo el código
COPY . .

# Build
WORKDIR "/src/WebAPI"
RUN dotnet build "WebAPI.csproj" -c Release -o /app/build

# Publish
FROM build AS publish
RUN dotnet publish "WebAPI.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
EXPOSE 10000

# Copiar archivos publicados
COPY --from=publish /app/publish .

# Variables de entorno
ENV ASPNETCORE_URLS=http://0.0.0.0:10000
ENV ASPNETCORE_ENVIRONMENT=Production

# Comando de inicio
ENTRYPOINT ["dotnet", "WebAPI.dll"]