# Build From Source

This document describes how to build the DocSpace MCP server from source code in
different formats.

## Contents

- [Docker Image](#docker-image)
- [Node.js Application](#nodejs-application)
- [Desktop Extension](#desktop-extension)
- [References](#references)

## Docker Image

Building and using the Docker image requires [Docker] to be installed on your
system.

1. Clone the repository from the company's Git server:

  ```sh
  git clone git@git.onlyoffice.com:ONLYOFFICE/docspace-mcp.git
  ```

  Alternatively, clone from the GitHub mirror:

  ```sh
  git clone git@github.com:ONLYOFFICE/docspace-mcp.git
  ```

2. Navigate to the project directory:

  ```sh
  cd docspace-mcp
  ```

3. Build the Docker image:

  ```sh
  docker build --tag onlyoffice/docspace-mcp .
  ```

4. Run the Docker container:

  ```sh
  docker run --interactive --rm onlyoffice/docspace-mcp
  ```

## Node.js Application

Building the Node.js application requires [Node.js] version 24 or higher and
[pnpm] version 10 or higher to be installed on your system.

Running the Node.js application requires [Node.js] version 18 or higher to be
installed on your system.

This project uses [mise], a polyglot tool version manager, to manage development
tool versions. If you have experience with tools like [asdf], [nvm], [nodenv],
or similar, you will find this familiar.

1. Clone the repository from the company's Git server:

  ```sh
  git clone git@git.onlyoffice.com:ONLYOFFICE/docspace-mcp.git
  ```

  Alternatively, clone from the GitHub mirror:

  ```sh
  git clone git@github.com:ONLYOFFICE/docspace-mcp.git
  ```

2. Navigate to the project directory:

  ```sh
  cd docspace-mcp
  ```

3. Build the Node.js application:

  ```sh
  pnpm build-app
  ```

4. Run the Node.js application:

  ```sh
  ./bin/onlyoffice-docspace-mcp
  ```

## Desktop Extension

Building the Desktop Extension requires [Node.js] version 24 or higher and
[pnpm] version 10 or higher to be installed on your system.

Running the Desktop Extension requires [Node.js] version 18 or higher to be
installed on your system.

This project uses [mise], a polyglot tool version manager, to manage development
tool versions. If you have experience with tools like [asdf], [nvm], [nodenv],
or similar, you will find this familiar.

1. Clone the repository from the company's Git server:

  ```sh
  git clone git@git.onlyoffice.com:ONLYOFFICE/docspace-mcp.git
  ```

  Alternatively, clone from the GitHub mirror:

  ```sh
  git clone git@github.com:ONLYOFFICE/docspace-mcp.git
  ```

2. Navigate to the project directory:

  ```sh
  cd docspace-mcp
  ```

3. Build the Desktop Extension:

  ```sh
  pnpm build-dxt
  ```

6. Use the built `.dxt` file from the root of the project directory in your
  desktop application.

## References

- [Docker Docs: What is an image?]
- [GitHub Anthropic: Desktop Extensions]
- [GitHub ONLYOFFICE: DocSpace MCP Server]

<!-- Footnotes  -->

[asdf]: https://asdf-vm.com/
[Docker]: https://www.docker.com/
[mise]: https://mise.jdx.dev/
[Node.js]: https://nodejs.org/
[nodenv]: https://github.com/nodenv/nodenv/
[nvm]: https://github.com/nvm-sh/nvm/
[pnpm]: https://pnpm.io/

[Docker Docs: What is an image?]: https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-an-image/
[GitHub Anthropic: Desktop Extensions]: https://github.com/anthropics/dxt/
[GitHub ONLYOFFICE: DocSpace MCP Server]: https://github.com/ONLYOFFICE/docspace-mcp/
