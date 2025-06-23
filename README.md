# ONLYOFFICE DocSpace MCP Server

<!--generate badges-start-->

[![Open in VS Code using npx command](https://badgen.net/static/Open%20in%20VS%20Code/npx/blue)](https://insiders.vscode.dev/redirect/mcp/install?name=onlyoffice-docspace&inputs=%5B%7B%22type%22%3A%22promptString%22%2C%22id%22%3A%22docspace_base_url%22%2C%22description%22%3A%22The+base+URL+of+the+DocSpace+instance+for+API+requests.%22%7D%2C%7B%22type%22%3A%22promptString%22%2C%22id%22%3A%22docspace_api_key%22%2C%22description%22%3A%22The+API+key+for+accessing+the+DocSpace+API.%22%2C%22password%22%3Atrue%7D%5D&config=%7B%22env%22%3A%7B%22DOCSPACE_BASE_URL%22%3A%22%24%7Binput%3Adocspace_base_url%7D%22%2C%22DOCSPACE_API_KEY%22%3A%22%24%7Binput%3Adocspace_api_key%7D%22%7D%2C%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22--yes%22%2C%22%40onlyoffice%2Fdocspace-mcp%22%5D%7D)
[![Open in VS Code Insiders using npx command](https://badgen.net/static/Open%20in%20VS%20Code%20Insiders/npx/cyan)](https://insiders.vscode.dev/redirect/mcp/install?name=onlyoffice-docspace&inputs=%5B%7B%22type%22%3A%22promptString%22%2C%22id%22%3A%22docspace_base_url%22%2C%22description%22%3A%22The+base+URL+of+the+DocSpace+instance+for+API+requests.%22%7D%2C%7B%22type%22%3A%22promptString%22%2C%22id%22%3A%22docspace_api_key%22%2C%22description%22%3A%22The+API+key+for+accessing+the+DocSpace+API.%22%2C%22password%22%3Atrue%7D%5D&config=%7B%22env%22%3A%7B%22DOCSPACE_BASE_URL%22%3A%22%24%7Binput%3Adocspace_base_url%7D%22%2C%22DOCSPACE_API_KEY%22%3A%22%24%7Binput%3Adocspace_api_key%7D%22%7D%2C%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22--yes%22%2C%22%40onlyoffice%2Fdocspace-mcp%22%5D%7D&quality=insiders)

<!--generate badges-end-->

[Model Context Protocol] (MCP) is a standardized protocol for managing context between large language models (LLMs) and external systems. This repository provides an MCP server for [ONLYOFFICE DocSpace.]

## Installation

Most clients that implement the MCP protocol have a common configuration file in JSON format, inside which you can add ONLYOFFICE DocSpace MCP server as follows:

```json
{
	"mcpServers": {
		"onlyoffice-docspace": {
			"env": {
				"DOCSPACE_BASE_URL": "https://your-instance.onlyoffice.com",
				"DOCSPACE_API_KEY": "your-api-key"
			},
			"command": "npx",
			"args": ["--yes", "@onlyoffice/docspace-mcp"]
		}
	}
}
```

For a more detailed example of the MCP server installation process, see how it can be done [using Claude Desktop.]

## Configuration

The only way to configure ONLYOFFICE DocSpace MCP server is through environment variables. Below is an example of the `.env` file with possible configuration options:

```ini
# The base URL of the DocSpace instance for API requests.
# Type: URL
# Presence: Required
# Example: https://your-instance.onlyoffice.io/
DOCSPACE_BASE_URL=

# The origin URL to include in the Origin header for DocSpace API requests.
# Type: URL
# Presence: Optional
# Example: https://your-instance.onlyoffice.io/
DOCSPACE_ORIGIN=

# The user agent to include in the User-Agent header for DocSpace API requests.
# Type: String
# Presence: Optional
# Default: @onlyoffice/docspace-mcp v1.1.0
DOCSPACE_USER_AGENT=

# The API key for accessing the DocSpace API.
# Type: String
# Presence:
#   Required if nether DOCSPACE_AUTH_TOKEN nor DOCSPACE_USERNAME and
#   DOCSPACE_PASSWORD are provided.
# Example: sk-a499e...
DOCSPACE_API_KEY=

# The Personal Access Token (PAT) for accessing the DocSpace API.
# Type: String
# Presence:
#   Required if neither DOCSPACE_API_KEY nor DOCSPACE_USERNAME and
#   DOCSPACE_PASSWORD are provided.
# Example: Fe4Hrgl6...
DOCSPACE_AUTH_TOKEN=

# The username for accessing the DocSpace API using basic authentication.
# Type: String
# Presence:
#   Required if neither DOCSPACE_API_KEY nor DOCSPACE_AUTH_TOKEN are provided.
#   This configuration is used in conjunction with DOCSPACE_PASSWORD.
# Example: henry.milton@onlyoffice.com
DOCSPACE_USERNAME=

# The password for accessing the DocSpace API using basic authentication.
# Type: String
# Presence:
#   Required if neither DOCSPACE_API_KEY nor DOCSPACE_AUTH_TOKEN are provided.
#   This configuration is used in conjunction with DOCSPACE_USERNAME.
# Example: ditgor-p...
DOCSPACE_PASSWORD=

# Whether to enable dynamic tools.
# Type: Boolean
# Presence: Optional
# Default: false
DOCSPACE_DYNAMIC=

# The list of toolsets to use or 'all' to use all available toolsets.
# Type: Comma-separated list of strings
# Presence: Optional
# Default: all
DOCSPACE_TOOLSETS=
```

## Usage

Model Context Protocol describes several different concepts, however ONLYOFFICE DocSpace MCP server implements [Tools] only.

### Toolsets

In addition to the existing concept of Tools, ONLYOFFICE DocSpace MCP server introduces a new one, Toolsets. A Toolset is a set of related tools. Using the `DOCSPACE_TOOLSETS` configuration option, you can specify the tools from selected toolsets that will be available in ONLYOFFICE DocSpace MCP server. Below is a table with the names of available toolsets and their descriptions:

<!--generate toolsets-start-->

| #   | Name       | Description                                                                                           |
| --- | ---------- | ----------------------------------------------------------------------------------------------------- |
| 1   | `files`    | Operations for working with files, folders, and rooms.                                                |
| 2   | `others`   | Operations for listing additional enumeration values. Operations for downloading and uploading files. |
| 3   | `people`   | Operations for working with users.                                                                    |
| 4   | `portal`   | Operations for working with the portal.                                                               |
| 5   | `settings` | Operations for working with settings.                                                                 |

<!--generate toolsets-end-->

### Meta Tools

In some cases, directly connecting all available tools can be problematic. Using the `DOCSPACE_DYNAMIC` configuration option, you can wrap all available tools into meta-tools. Meta-tools are tools that allow an AI model to interact with other tools dynamically without loading them all simultaneously. Below is a table with the names of available meta-tools and their descriptions:

<!--generate dynamic-start-->

| #   | Name                    | Description                                                                                                                                                                                     |
| --- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `call_tool`             | This is a meta-tool for calling a tool. The list of available tools can be obtained using the list_tools meta-tool. The input schema can be obtained using the get_tool_input_schema meta-tool. |
| 2   | `get_tool_input_schema` | This is a meta-tool for getting an input schema for a specific tool. The list of available tools can be obtained using the list_tools meta-tool.                                                |
| 3   | `list_tools`            | This is a meta-tool for listing available tools of a specific toolset. The list of available toolsets can be obtained using the list_toolsets meta-tool.                                        |
| 4   | `list_toolsets`         | This is a meta-tool for listing available toolsets. Toolset is a set of available tools.                                                                                                        |

<!--generate dynamic-end-->

### Tools

Below is a table with the names of available tools and their descriptions:

<!--generate tools-start-->

| #   | Name                               | Description                                             |
| --- | ---------------------------------- | ------------------------------------------------------- |
| 1   | `files_archive_room`               | Archive a room.                                         |
| 2   | `files_copy_batch_items`           | Copy to a folder.                                       |
| 3   | `files_create_folder`              | Create a folder.                                        |
| 4   | `files_create_room`                | Create a room.                                          |
| 5   | `files_delete_file`                | Delete a file.                                          |
| 6   | `files_delete_folder`              | Delete a folder.                                        |
| 7   | `files_get_file_info`              | Get file information.                                   |
| 8   | `files_get_folder`                 | Get content of a folder.                                |
| 9   | `files_get_folder_info`            | Get folder information.                                 |
| 10  | `files_get_folders`                | Get subfolders of a folder.                             |
| 11  | `files_get_my_folder`              | Get the 'My Documents' folder.                          |
| 12  | `files_get_operation_statuses`     | Get active file operations.                             |
| 13  | `files_get_room_info`              | Get room information.                                   |
| 14  | `files_get_room_security_info`     | Get a list of users with their access levels to a room. |
| 15  | `files_get_rooms_folder`           | Get the 'Rooms' folder.                                 |
| 16  | `files_move_batch_items`           | Move to a folder.                                       |
| 17  | `files_rename_folder`              | Rename a folder.                                        |
| 18  | `files_set_room_security`          | Invite or remove users from a room.                     |
| 19  | `files_update_file`                | Update a file.                                          |
| 20  | `files_update_room`                | Update a room.                                          |
| 21  | `others_download_as_text`          | Download a file as text.                                |
| 22  | `others_get_available_room_access` | Get a list of available room invitation access levels.  |
| 23  | `others_get_available_room_types`  | Get a list of available room types.                     |
| 24  | `others_upload_file`               | Upload a file.                                          |
| 25  | `people_get_all`                   | Get all people.                                         |
| 26  | `portal_get_quota`                 | Get the current quota.                                  |
| 27  | `portal_get_tariff`                | Get the current tariff.                                 |
| 28  | `settings_get_supported_cultures`  | Get a list of the supported cultures, languages.        |
| 29  | `settings_get_time_zones`          | Get a list of the available time zones.                 |

<!--generate tools-end-->

## License

ONLYOFFICE DocSpace MCP server is distributed under the Apache-2.0 license found in the [LICENSE] file.

<!-- Footnotes -->

[LICENSE]: https://github.com/onlyoffice/docspace-mcp/blob/master/LICENSE/
[Model Context Protocol]: https://modelcontextprotocol.io/
[ONLYOFFICE DocSpace.]: https://www.onlyoffice.com/docspace.aspx
[using Claude Desktop.]: https://modelcontextprotocol.io/quickstart/user/#for-claude-desktop-users
[Tools]: https://modelcontextprotocol.io/docs/concepts/tools/
