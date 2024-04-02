<!--
Hey, thanks for using the awesome-readme-template template.  
If you have any enhancements, then fork this project and create a pull request 
or just open an issue with the label "enhancement".

Don't forget to give this project a star for additional support ;)
Maybe you can mention me or this repo in the acknowledgements too
-->
<div align="center">

  <img src="assets/logo.png" alt="logo" width="200" height="auto" />
  <h1>Collect3.me</h1>
  
  <p>
    This is a Web3 project with the goal to save your favorite content FOREVER! 
  </p>
  
  
<!-- Badges -->
<p>
  <a href="https://github.com/8infinitelabs/collect3/graphs/contributors">
    <img src="https://img.shields.io/github/contributors/8infinitelabs/collect3" alt="contributors" />
  </a>
  <a href="">
    <img src="https://img.shields.io/github/last-commit/8infinitelabs/collect3" alt="last update" />
  </a>
  <a href="https://github.com/8infinitelabs/collect3/network/members">
    <img src="https://img.shields.io/github/forks/8infinitelabs/collect3" alt="forks" />
  </a>
  <a href="https://github.com/8infinitelabs/collect3/stargazers">
    <img src="https://img.shields.io/github/stars/8infinitelabs/collect3" alt="stars" />
  </a>
  <a href="https://github.com/8infinitelabs/collect3/issues/">
    <img src="https://img.shields.io/github/issues/8infinitelabs/collect3" alt="open issues" />
  </a>
  <a href="https://github.com/8infinitelabs/collect3/blob/master/LICENSE">
    <img src="https://img.shields.io/github/license/8infinitelabs/collect3.svg" alt="license" />
  </a>
</p>
   
<h4>
    <a href="https://collect3.me/">Website</a>
   <span> · </span>
    <a href="https://chrome.google.com/webstore/detail/collect3/afahgefgimgodpkiapdbjlcchdogfeib">Download beta</a>
  <span> · </span>
    <a href="https://github.com/8infinitelabs/collect3/issues/">Report Bug</a>
  <span> · </span>
    <a href="https://github.com/8infinitelabs/collect3/issues/">Request Feature</a>
  </h4>
</div>

<br />

## :gear: Installing Extension

first we need to move to the extension directory
```bash
  cd packages/extension
```

we can start by installing the dependencies
```bash
  yarn install
```

Copy the contents of the .env.example and create your .env

Then you can build the extension
```sh
  yarn build
```
or you can execute this command if you are going to make changes to the code.
```sh
  yarn start
```

[And finally you can install it this way](https://superuser.com/questions/247651/how-does-one-install-an-extension-for-chrome-browser-from-the-local-file-system/)

## :gear: Using Remote Server
If you want to use an already available server instead of hosting your own
you can.

First you need to open the extension and click in the "My Storage" button,
this will take you to a new page where you can manage your storage options,
to add a new one you just need the server url, an alias of your choice,
and then you can click the "create storage option" button.

<!-- Run Locally -->
### :running: Run Locally

Clone the project

```bash
  git clone https://github.com/8infinitelabs/collect3.git
```

Go to the project directory

```bash
  cd collect3/
```

Create a renterd config file
```bash
  renterd config
```
make sure to select yes when asked if you want to configure the s3 settings.

With this information you can create the .env file following the example in the root directoryof the project,
now the next step will be running

```bash
  docker-compose up -d
```
you can open the renterd dashboard in your browser and configure your node.
once all is done you can configure the s5 node, first check the container name with

```bash
  docker-compose ps
```

now that you know the name you can copy the s5 config from the container
```bash
  docker-compose cp <s5-container-name>:/config/config.toml ./temp.toml
```
after that you can use the s5-config-example.toml to modify the temp.toml and copy the file back to the container
```bash
  docker-compose cp ./temp.toml <s5-container-name>:/config/config.toml
```
and then restart the container
```bash
  docker-compose restart <container-name>
```
now, you need to do one last thing before moving away from the containers
```bash
  docker-compose logs <s5-container-name>
```
look for the ADMIN API KEY and copy it, this is the key you will need for the next step

```bash
  cd packages/backend
```
here you will use the key from the previous step to create the .env following the example file.

the next step is creating the database file

```bash
  sqlite3 db/local.db
```

after that you can install the backend dependencies
```bash
  go mod tidy
```

and for the backend you can user [air](https://github.com/cosmtrek/air) for development or just run
```bash
  go run main.go
```

for production you can compile it and run the executable that you will find in the build folder
```bash
  go build ./
```

## Common Problems

### undefined: sqlite3.Error
 if you face this error where sqlite3 is undefinded you need to set this env variable
 ```
   CGO_ENABLED=1
 ```
 and make sure you have installed gcc

<!-- Contributing -->
## :wave: Contributing

<a href="https://github.com/8infinitelabs/collect3/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=8infinitelabs/collect3" />
</a>


Contributions are always welcome!

See `contributing.md` for ways to get started.


<!-- Code of Conduct -->
### :scroll: Code of Conduct

Please read the [Code of Conduct](https://github.com/8infinitelabs/collect3/blob/master/CODE_OF_CONDUCT.md)

<!-- FAQ 
## :grey_question: FAQ

- Question 1

  + Answer 1

- Question 2

  + Answer 2

-->

<!-- License -->
## :warning: License

Distributed under the no License. See LICENSE for more information.


<!-- Contact -->
## :handshake: Contact

Diego Torres - [@twitter_handle](https://twitter.com/0xdiegotorres) - diego@infinitelabs.co

Project Link: [https://github.com/8infinitelabs/collect3](https://github.com/8infinitelabs/collect3)


<!-- Acknowledgments -->
## :gem: Acknowledgements

Use this section to mention useful resources and libraries that you have used in your projects.

 - [Shields.io](https://shields.io/)
 - [Awesome README](https://github.com/matiassingers/awesome-readme)
 - [Emoji Cheat Sheet](https://github.com/ikatyang/emoji-cheat-sheet/blob/master/README.md#travel--places)
 - [Readme Template](https://github.com/othneildrew/Best-README-Template)

