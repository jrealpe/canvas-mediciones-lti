import React, { Component } from 'react';

export class Layout extends Component {
  static displayName = Layout.name;

  render () {
    return (
        <div style={{"paddingTop": 24}}>
        {this.props.children}
      </div>
    );
  }
}
