import React, { Component } from "react";
import PropTypes from "prop-types";
import { Redirect } from "react-router";

import StyledFirebaseAuth from "react-firebaseui/StyledFirebaseAuth";
import firebase from "firebase/app";
import "firebase/auth";

import { connect } from "react-redux";
import { authenticated, getUserSettings } from "../../actions/firebase";

const OAuthLoginMeta = {
  location: "/login/",
  label: "Login",
};

class OAuthLogin extends Component {
  constructor(props) {
    super(props);

    this.state = { isSignIn: false };
    this.uiConfig = this.uiConfig.bind(this);
  }

  componentDidMount() {}

  // Configure FirebaseUI.
  uiConfig() {
    return {
      signInFlow: "redirect",
      // signInFlow: "popup",

      signInOptions: [
        // firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        // firebase.auth.FacebookAuthProvider.PROVIDER_ID,
        // firebase.auth.TwitterAuthProvider.PROVIDER_ID,

        // https://firebase.google.com/docs/auth/web/email-link-auth?authuser=0
        // https://firebase.google.com/docs/auth/web/firebaseui#email_link_authentication
        // https://firebaseopensource.com/projects/firebase/firebaseui-web/
        // {
        //   provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
        //   signInMethod:
        //     firebase.auth.EmailAuthProvider.EMAIL_LINK_SIGN_IN_METHOD,
        // },
        {
          provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
          signInMethod:
            firebase.auth.EmailAuthProvider.EMAIL_PASSWORD_SIGN_IN_METHOD,
        },
        firebase.auth.GithubAuthProvider.PROVIDER_ID,
      ],
      callbacks: {
        signInSuccessWithAuthResult: (authResult /*, redirectUrl*/) => {
          // console.log("success");
          // authResult = {
          //   user: {uid, email, isAnonymous, phoneNumber},
          //   additionalUserInfo: { isNewUser: false, providerId: "password" },
          // };
          // console.log(authResult);
          // console.log(redirectUrl); // undefined
          const { user } = authResult;
          // const userData = await mapUserData(user);
          // setUserCookie(userData);
          this.props.authenticated(user.uid);
          this.props.getUserSettings();
        },
      },
    };
  }

  render() {
    let content;

    if (this.props.user) {
      content = <Redirect to="/" />;
    } else {
      content = (
        <div className="userPage mt-5 pt-3">
          <StyledFirebaseAuth
            uiConfig={this.uiConfig()}
            firebaseAuth={firebase.auth()}
          />
        </div>
      );
    }

    return content;
  }
}

OAuthLogin.propTypes = {
  authenticated: PropTypes.func,
  getUserSettings: PropTypes.func,
  user: PropTypes.object,
};

const mapStateToProps = (state) => {
  return { user: state.login.user };
};

export default connect(mapStateToProps, { authenticated, getUserSettings })(
  OAuthLogin
);

export { OAuthLoginMeta };
