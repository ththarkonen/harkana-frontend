# HARKANA frontend

This repository contains the frontend codebase for the **HARKANA** web applications:

- https://harkana.com
- https://raman.harkana.com
- https://cars.harkana.com

The applications provide interactive user interfaces for visualization and correction workflows in Raman and coherent anti-Stokes Raman scattering (CARS) spectroscopy. The uncertainty-aware correction methods exposed through the platform are grounded in the following peer-reviewed work:

Härkönen, Teemu, Erik M. Vartiainen, Lasse Lensu, Matthew T. Moores, and Lassi Roininen. "Log-Gaussian gamma processes for training Bayesian neural networks in Raman and CARS spectroscopies." Physical Chemistry Chemical Physics 26, no. 4 (2024): 3389-3399.
https://doi.org/10.1039/D3CP04786A

The frontend serves as a presentation and interaction layer for backend implementations of these methods, enabling:
- Visualization of measured and corrected Raman and CARS spectra
- Sharing of results with collaborators with other users
- Deposition of the results on Zenodo for persistent storage and a digital object identifier (DOI)

This repository does not implement the underlying statistical or machine-learning methodology itself.

## Historical note

The HARKANA frontend project has its origins in earlier work conducted within the **Quantitative Chemically-Specific Imaging (qCSI)** (https://qcsi.fi/) research infrastructure project. In particular, it draws on concepts and practical experience gained from the development of the **qCSI online data analysis platform**, which explored web-based approaches for the visualization and quantitative analysis of spectroscopic datasets.

The qCSI platform investigated browser-based interaction with spectroscopic data, remote access to computational analysis workflows, and scalable presentation of chemically specific results. Although the qCSI project itself has concluded, insights from its online analysis platform informed several architectural and usability decisions in the HARKANA frontend.

No source code from the original qCSI platform is included in this repository.

## Applications

All HARKANA applications are built from a shared frontend codebase using environment-specific configuration. The applications provide tools for interactive visualization, uncertainty-aware correction, and collaborative handling of Raman and CARS spectroscopic data.

Common functionality across the applications includes:
- Interactive visualization of measured and corrected spectra
- Uncertainty-aware presentation of correction results
- Tools for sharing datasets and results with collaborators
- Upload of datasets and derived results to [**Zenodo**](https://zenodo.org) for persistent storage and assignment of a DOI

### [harkana.com](https://harkana.com)
Landing site providing an overview of the HARKANA platform.

### [raman.harkana.com](https://raman.harkana.com)
Application dedicated to Raman spectroscopy workflows.

### [cars.harkana.com](https://cars.harkana.com)
Application dedicated to CARS spectroscopy workflows.


## Technical stack

- Framework: Vue 3
- Build Tool: Vite
- Language: JavaScript
- Hosting: AWS Amplify Hosting
- Authentication: AWS Amplify Auth
- Storage: AWS Amplify Storage (Amazon S3)

Each application is deployed independently via AWS Amplify.

## Installation and development

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-org/harkana-frontend.git
```

For the landing site, navigate to the `landing` directory and install dependencies:

```bash
cd landing
npm install
npm run dev
```

For the applications, navigate to their respective directories and install dependencies and set up AWS Amplify resources:

```bash
cd raman    # or 'cars'
npm install
amplify init
amplify add auth
amplify add storage
amplify push
npm run dev
```

## Environment configuration

The HARKANA frontend uses environment variables to configure the backend API, data type, versioning, and client-side Paddle purchase integration. These are defined in a `.env` file:

```env
# Backend API base URL
VITE_BASE_URL=https://api.harkana.com

# Application version (automatically picked up from package.json)
VITE_VERSION=$npm_package_version

# Name of the application
VITE_APP_NAME=Raman

# Data type handled by this instance (e.g., 'raman' or 'cars')
VITE_DATA_TYPE=raman

# Client-side Paddle token for purchase workflow
VITE_PADDLE_CLIENT_SIDE_TOKEN=live_a6a88d5201b7fa4feb1ba762f20

# Paddle price ID for subscription or purchase
VITE_PADDLE_PRICE_ID=pri_01kcszjfg5g33epm31h9nzhh8q
```

The .env files can be found inside the CARS and Raman application folders

**Notes:**
- These variables are frontend-only; no AWS Amplify configuration is required here.
- `VITE_DATA_TYPE` determines which workflow (Raman or CARS) the application handles.
- `VITE_VERSION` is automatically injected from your `package.json` for version tracking.


## Build and deployment

Build the application:

```bash
npm run build
```

Each sub-application is deployed using AWS Amplify Hosting with a dedicated Amplify environment.

- Landing: harkana.com
- Raman: raman.harkana.com
- CARS: cars.harkana.com

The `main` branch reflects the currently deployed, production-ready state.

## Project structure

```text
frontend/
├── apps/             # Individual applications
│   ├── cars/         # CARS spectroscopy frontend
│   ├── landing/      # Landing site
│   └── raman/        # Raman spectroscopy frontend
├── packages/         # Shared frontend packages
│   ├── plot/         # Plotting utilities and components
│   ├── tokens/       # Compute token related utilities
│   ├── tools/        # Reusable utility functions
│   ├── ui-core/      # Core UI components
│   ├── ui-loading/   # Loading / skeleton components
│   └── ui-theme/     # Tailwind and theme configuration
├── package.json      # Root package manifest
├── pnpm-lock.yaml    # Lockfile for dependencies
├── pnpm-workspace.yaml # Monorepo workspace configuration
└── README.md         # This file
```

**Notes:**

- `apps/` contains the three deployed applications (landing, Raman, CARS).  
- `packages/` contains shared code that is reused across apps.  
- This layout follows a **monorepo pattern** managed with `pnpm workspaces`.

## Citation

If you use the HARKANA platform or reference its methodological basis in academic work, please cite:

```bibtex
@article{Harkonen:2024,
    title={Log-Gaussian gamma processes for training Bayesian neural networks in Raman and CARS spectroscopies},
    author={H{\"a}rk{\"o}nen, Teemu and Vartiainen, Erik M and Lensu, Lasse and Moores, Matthew T and Roininen, Lassi},
    journal={Physical Chemistry Chemical Physics},
    volume={26},
    number={4},
    pages={3389--3399},
    year={2024},
    publisher={Royal Society of Chemistry}
}
```

## License

```text
MIT License
```