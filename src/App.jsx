import React, { Component } from 'react'
import './App.css'
import ParticlesBg from 'particles-bg'
import Navigation from './components/Navigation/Navigation'
import Signin from './components/Signin/Signin'
import Register from './components/Register/Register'
import FaceRecognition from './components/FaceRecognition/FaceRecognition'
import Logo from './components/Logo/Logo'
import ImageLinkForm from './components/ImageLinkForm/ImageLinkForm'
import Rank from './components/Rank/Rank'

const MODEL_ID = 'face-detection';
const returnClarifaiRequestOptions = (imageUrl) => {
  // Your PAT (Personal Access Token) can be found in the Account's Security section
  const PAT = 'd5de0b7257b4447f8d394b89b2d9b610';
  // Specify the correct user_id/app_id pairings
  // Since you're making inferences outside your app's scope
  const USER_ID = 'pash0911dan';       
  const APP_ID = 'my-ClarifyAPI-hlf2hp';
  // Change these to whatever model and image URL you want to use
  
  const IMAGE_URL = imageUrl;

  const raw = JSON.stringify({
    "user_app_id": {
        "user_id": USER_ID,
        "app_id": APP_ID
    },
    "inputs": [
        {
            "data": {
                "image": {
                    "url": IMAGE_URL
                }
            }
        }
    ]
  });
  
  const requestOptions = {
    method: 'POST',
    headers: {
        'Accept': 'application/json',
        'Authorization': 'Key ' + PAT
    },
    body: raw
  };

  return requestOptions;

}

class App extends Component {
constructor() {
  super()
  this.state = {
    input: '',
    imageUrl: '',
    box: {},
    route: 'signin',
    isSignedIn: false,
    user: {
      id: '',
      name: '',
      email: '',
      entries: 0,
      joined: ''
  }
}
}


loadUser = (data) => {
  this.setState({user: {
    id: data.id,
    name: data.name,
    email: data.email,
    entries: data.entries,
    joined: data.joined
  }}) 
}

calculateFaceLocation = (data) => {
  const clarifaiFace = data.outputs[0].data.regions[0].region_info.bounding_box;
  const image = document.getElementById('inputimage');
  const width = Number(image.width);
  const height = Number(image.height);
  return {
    leftCol: clarifaiFace.left_col * width,
    topRow: clarifaiFace.top_row * height,
    rightCol: width - (clarifaiFace.right_col * width),
    bottomRow: height - (clarifaiFace.bottom_row * height)
  }
}

displayFaceBox = (box) => {
  this.setState({box: box});
}

onInputChange = (event) => {
  this.setState({input: event.target.value})
}

onButtonSubmit = () => {
  this.setState({imageUrl: this.state.input})
  fetch("https://cors-anywhere.herokuapp.com/https://api.clarifai.com/v2/models/" + MODEL_ID  + "/outputs", returnClarifaiRequestOptions(this.state.input))
  .then(response => response.json())
  .then(response => {
    console.log('hi', response)
    if (response) {
      fetch('http://localhost:3000/image', {
      method: 'put',
         headers: {'Content-Type': 'application/json'},
         body: JSON.stringify({
           id: this.state.user.id
         })
       })
         .then(response => response.json())
         .then(count => {
          this.setState(Object.assign(this.state.user, { entries: count}))
        })
         .catch(console.log)
      this.setState(Object.assign(this.state.user, { entries: this.state.user.entries + 1}))
    }
    this.displayFaceBox(this.calculateFaceLocation(response))
  })
  .catch(err => console.log(err));
}

onRouteChange = (route) => {
  if (route === 'signout') {
    this.setState({isSignedIn: false})
  } else if (route === 'home') {
    this.setState({isSignedIn: true})
  }
  this.setState({route: route});
}

render() {
  const { isSignedIn, imageUrl, route, box } = this.state;
  return (
    <div className="App">
      <ParticlesBg type="coe" bg={true} />
      <Navigation  isSignedIn={isSignedIn} onRouteChange={this.onRouteChange}/>
      { this.state.route === 'home'? 
      <div>
        <Logo />
        <Rank name={this.state.user.name} entries={this.state.user.entries} />
        <ImageLinkForm 
          onInputChange={this.onInputChange} 
          onButtonSubmit={this.onButtonSubmit}
        />
        <FaceRecognition box={box} imageUrl={imageUrl} />
      </div>
      : (
          route === 'signin' 
          ? <Signin loadUser={this.loadUser} onRouteChange={this.onRouteChange} />
          : <Register loadUser={this.loadUser} onRouteChange={this.onRouteChange} />
        )
    }
    </div>
  );
  }
}

export default App
