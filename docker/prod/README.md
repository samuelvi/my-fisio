# Production Configuration

This directory contains configuration files for the production environment.

## 🚀 Deployment Strategy

The project uses an **isolated build strategy** for production.

**Commands:**
- `make prod-build`: Builds the application in a clean Docker container and exports the artifacts to the `dist/` folder.
- `make prod-deploy`: Deploys the `dist/` folder to the remote server using `rsync`.

See [docs/DEPLOYMENT.md](../../docs/DEPLOYMENT.md) for the complete deployment guide.

## 📂 Directory Structure

- `dist/`: (Created by build) Contains the compiled production artifacts.
- `build/`: Configuration for the build process.
- `nginx/`: Production Nginx configuration.
- `php/`: Production PHP configuration.

## Legacy / Manual Docker Usage

The `docker-compose.yaml` in this directory is preserved for reference or manual Docker deployments, but the `Makefile` commands (`prod-up`, etc.) have been removed to encourage the `dist/` artifact strategy.

If you wish to run production via Docker locally or on a server, you will need to manually use `docker-compose up -d` and ensure your volumes are correctly mapped.