# ONLYOFFICE DocSpace MCP Server

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

The only way to configure ONLYOFFICE DocSpace MCP server is through environment variables. Below is a table with the names of available environment variables and their descriptions:

<!--generate config-start-->

| Name                  | Description                                                                                                                                                                                                                        |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DOCSPACE_BASE_URL`   | The base URL of the DocSpace instance. This configuration is required for making API requests to DocSpace.                                                                                                                         |
| `DOCSPACE_ORIGIN`     | The origin of the DocSpace instance. This configuration is not required but can be used to specify the `Origin` header in requests to DocSpace.                                                                                    |
| `DOCSPACE_USER_AGENT` | The user agent to use for requests. This configuration is not required but can be used to specify the `User-Agent` header in requests to DocSpace.                                                                                 |
| `DOCSPACE_API_KEY`    | The API key for accessing the DocSpace API. This configuration is required if nether `DOCSPACE_AUTH_TOKEN` nor `DOCSPACE_USERNAME` and `DOCSPACE_PASSWORD` are provided.                                                           |
| `DOCSPACE_AUTH_TOKEN` | The authentication token for accessing the DocSpace API. This configuration is required if neither `DOCSPACE_API_KEY` nor `DOCSPACE_USERNAME` and `DOCSPACE_PASSWORD` are provided.                                                |
| `DOCSPACE_USERNAME`   | The username for accessing the DocSpace API using basic authentication. This configuration is required if neither `DOCSPACE_API_KEY` nor `DOCSPACE_AUTH_TOKEN` are provided. This is used in conjunction with `DOCSPACE_PASSWORD`. |
| `DOCSPACE_PASSWORD`   | The password for accessing the DocSpace API using basic authentication. This configuration is required if neither `DOCSPACE_API_KEY` nor `DOCSPACE_AUTH_TOKEN` are provided. This is used in conjunction with `DOCSPACE_USERNAME`. |

<!--generate config-end-->

## Usage

Model Context Protocol describes several different concepts, however ONLYOFFICE DocSpace MCP server implements [Tools] only.

### Tools

Below is a table with the names of available tools and their descriptions:

<!--generate tools-start-->

| #   | Name                           | Description                    |
| --- | ------------------------------ | ------------------------------ |
| 1   | `files.archive_room`           | Archive a room.                |
| 2   | `files.copy_batch_items`       | Copy to a folder.              |
| 3   | `files.create_folder`          | Create a folder.               |
| 4   | `files.create_room`            | Create a room.                 |
| 5   | `files.delete_file`            | Delete a file.                 |
| 6   | `files.delete_folder`          | Delete a folder.               |
| 7   | `files.get_file_info`          | Get file information.          |
| 8   | `files.get_folder`             | Get content of a folder.       |
| 9   | `files.get_folder_info`        | Get folder information.        |
| 10  | `files.get_folders`            | Get subfolders of a folder.    |
| 11  | `files.get_my_folder`          | Get the 'My Documents' folder. |
| 12  | `files.get_operation_statuses` | Get active file operations.    |
| 13  | `files.get_room_info`          | Get room information.          |
| 14  | `files.get_room_security_info` | Get room access rights.        |
| 15  | `files.get_rooms_folder`       | Get the 'Rooms' folder.        |
| 16  | `files.move_batch_items`       | Move to a folder.              |
| 17  | `files.rename_folder`          | Rename a folder.               |
| 18  | `files.set_room_security`      | Set room access rights.        |
| 19  | `files.update_file`            | Update a file.                 |
| 20  | `files.update_room`            | Update a room.                 |
| 21  | `others.download_as_text`      | Download a file as text.       |
| 22  | `others.upload_file`           | Upload a file.                 |
| 23  | `people.get_all`               | Get all people.                |

<!--generate tools-end-->

## License

This SDK is distributed under the Apache-2.0 license found in the [LICENSE] file.

<!-- Footnotes -->

[LICENSE]: https://github.com/onlyoffice/docspace-mcp/blob/master/LICENSE/
[Model Context Protocol]: https://modelcontextprotocol.io/
[ONLYOFFICE DocSpace.]: https://www.onlyoffice.com/docspace.aspx
[using Claude Desktop.]: https://modelcontextprotocol.io/quickstart/user/#for-claude-desktop-users
[Tools]: https://modelcontextprotocol.io/docs/concepts/tools/
