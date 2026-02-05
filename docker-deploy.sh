#!/bin/bash

# 🐳 Resort Booking System - Docker Deployment Script
# This script automates the entire Docker deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="resort-booking"
COMPOSE_FILE="docker-compose.yml"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then 
        print_error "Please run as root (use sudo)"
        exit 1
    fi
}

# Check if Docker is installed
check_docker() {
    print_status "Checking Docker installation..."
    
    if ! command -v docker &> /dev/null; then
        print_warning "Docker not found. Installing Docker..."
        install_docker
    else
        print_success "Docker is installed: $(docker --version)"
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_warning "Docker Compose not found. Installing Docker Compose..."
        install_docker_compose
    else
        print_success "Docker Compose is installed: $(docker-compose --version)"
    fi
    
    # Start Docker service if not running
    if ! systemctl is-active --quiet docker; then
        print_status "Starting Docker service..."
        systemctl start docker
        systemctl enable docker
        print_success "Docker service started"
    fi
}

# Install Docker
install_docker() {
    print_status "Installing Docker..."
    
    # Update package index
    apt-get update
    
    # Install prerequisites
    apt-get install -y \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Set up the stable repository
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
        $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
    
    print_success "Docker installed successfully"
}

# Install Docker Compose
install_docker_compose() {
    print_status "Installing Docker Compose..."
    
    # Download Docker Compose
    curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    
    # Apply executable permissions
    chmod +x /usr/local/bin/docker-compose
    
    # Create symlink
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    
    print_success "Docker Compose installed successfully"
}

# Setup environment file
setup_environment() {
    print_status "Setting up environment configuration..."
    
    if [ ! -f .env ]; then
        if [ -f .env.docker ]; then
            cp .env.docker .env
            print_warning "Environment file created from template"
            print_warning "⚠️  IMPORTANT: Please edit .env file with your configuration before continuing!"
            print_status "File location: $(pwd)/.env"
            
            # Ask user to confirm they've edited the file
            read -p "Have you edited the .env file? (y/N): " confirm
            if [[ $confirm != [yY] && $confirm != [yY][eE][sS] ]]; then
                print_error "Please edit the .env file and run this script again"
                exit 1
            fi
        else
            print_error ".env.docker template not found!"
            exit 1
        fi
    else
        print_success "Environment file already exists"
    fi
    
    # Source the environment variables
    set -a
    source .env
    set +a
}

# Check for port conflicts
check_ports() {
    print_status "Checking for port conflicts..."
    
    local ports=(80 5000 5432)
    local conflict=false
    
    for port in "${ports[@]}"; do
        if netstat -tuln | grep -q ":$port "; then
            print_warning "Port $port is already in use"
            conflict=true
            
            # Try to identify what's using the port
            local pid=$(netstat -tulpn 2>/dev/null | grep ":$port " | awk '{print $7}' | cut -d'/' -f1)
            if [ -n "$pid" ]; then
                print_warning "Process using port $port: PID $pid"
            fi
        fi
    done
    
    if [ "$conflict" = true ]; then
        print_warning "Port conflicts detected. Attempting to resolve..."
        
        # Stop common services that might conflict
        systemctl stop apache2 2>/dev/null || true
        systemctl stop nginx 2>/dev/null || true
        
        print_status "Stopped potentially conflicting services"
    fi
}

# Build and start containers
build_and_deploy() {
    print_status "Building and deploying containers..."
    
    # Stop any existing containers
    docker-compose down 2>/dev/null || true
    
    # Build images
    print_status "Building Docker images..."
    docker-compose build --no-cache
    
    # Start containers
    print_status "Starting containers..."
    docker-compose up -d
    
    # Wait for services to be healthy
    print_status "Waiting for services to start..."
    sleep 10
    
    # Check if containers are running
    local running=$(docker-compose ps -q | wc -l)
    if [ "$running" -lt 3 ]; then
        print_error "Some containers failed to start. Checking logs..."
        docker-compose logs
        exit 1
    fi
    
    print_success "Containers started successfully"
}

# Wait for database seeding
wait_for_seed() {
    print_status "Waiting for database seeding to complete..."
    
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if docker-compose ps | grep -q "resort-db-seed.*Exit 0"; then
            print_success "Database seeding completed"
            return 0
        fi
        
        if docker-compose ps | grep -q "resort-db-seed.*Exit"; then
            print_warning "Database seeding container exited with error"
            docker-compose logs db-seed
            return 1
        fi
        
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_warning "Database seeding timeout - continuing anyway..."
    return 0
}

# Verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    local backend_url="http://localhost:5000/api/health"
    local frontend_url="http://localhost"
    
    # Check backend
    if curl -s "$backend_url" > /dev/null; then
        print_success "Backend is responding"
    else
        print_error "Backend is not responding"
        docker-compose logs backend
        return 1
    fi
    
    # Check frontend
    if curl -s -o /dev/null -w "%{http_code}" "$frontend_url" | grep -q "200\|301\|302"; then
        print_success "Frontend is responding"
    else
        print_error "Frontend is not responding"
        docker-compose logs frontend
        return 1
    fi
    
    print_success "Deployment verification successful!"
}

# Display final information
show_info() {
    echo ""
    echo "=========================================="
    echo -e "${GREEN}🎉 Deployment Complete!${NC}"
    echo "=========================================="
    echo ""
    echo "📊 Services Status:"
    docker-compose ps
    echo ""
    echo "🌐 Access Your Application:"
    echo "  Frontend: http://$(hostname -I | awk '{print $1}')"
    echo "  Backend API: http://$(hostname -I | awk '{print $1}'):5000"
    echo "  API Health: http://$(hostname -I | awk '{print $1}'):5000/api/health"
    echo ""
    echo "🔑 Default Login Credentials:"
    echo "  Email: admin@resort.com"
    echo "  Password: admin123"
    echo ""
    echo "📝 Useful Commands:"
    echo "  View logs: docker-compose logs -f"
    echo "  Stop: docker-compose down"
    echo "  Restart: docker-compose restart"
    echo "  Update: docker-compose pull && docker-compose up -d"
    echo ""
    echo "📁 Project Directory: $(pwd)"
    echo "📋 Documentation: DOCKER_DEPLOYMENT.md"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: Change default password after first login!${NC}"
    echo ""
}

# Setup firewall
setup_firewall() {
    print_status "Configuring firewall..."
    
    # Check if ufw is installed
    if command -v ufw &> /dev/null; then
        ufw default deny incoming
        ufw default allow outgoing
        ufw allow 22/tcp
        ufw allow 80/tcp
        ufw allow 443/tcp
        ufw --force enable
        print_success "Firewall configured"
    else
        print_warning "UFW not installed, skipping firewall configuration"
    fi
}

# Main deployment function
main() {
    echo "=========================================="
    echo -e "${BLUE}🏨 Resort Booking System${NC}"
    echo -e "${BLUE}🐳 Docker Deployment Script${NC}"
    echo "=========================================="
    echo ""
    
    # Check if we're in the right directory
    if [ ! -f "$COMPOSE_FILE" ]; then
        print_error "docker-compose.yml not found! Please run this script from the project root."
        exit 1
    fi
    
    # Run deployment steps
    check_root
    check_docker
    setup_environment
    check_ports
    build_and_deploy
    wait_for_seed
    verify_deployment
    setup_firewall
    show_info
}

# Run main function
main