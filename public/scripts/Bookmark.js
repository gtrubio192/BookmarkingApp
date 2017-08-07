var ListItem = React.createClass({
  rawMarkup: function() {
    var md = new Remarkable();
    var rawMarkup = md.render(this.props.children.toString());
    return { __html: rawMarkup };
  },

  render: function() {
    return (
      <div className="listing col-sm-10" data-key={this.props.id}>
        <span className="listing-title">
          {this.props.title}
        </span>
        <a className="listing-url" target="_blank" href={this.props.children} dangerouslySetInnerHTML={this.rawMarkup()} />
      </div>
    );
  }
});

var BookmarkApp = React.createClass({
  loadListFromServer: function() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      type: 'GET',
      cache: true,
      headers: { 'Authorization': 'fizzy_pop'},
      success: function(response) {       
        this.setState({data: response.data});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  handleListSubmit: function(attributes) {
    var listItem = {attributes};  
    var postData = {
      "data": {
          "attributes": {
            "title": listItem.attributes.title,
            "url": listItem.attributes.url
          }
        }
    };

    $.ajax({
      url: this.props.url,
      dataType: 'json',
      type: 'POST',
      data: postData,
      headers: { 'Authorization': 'fizzy_pop'},
      success: function(data) {
        var bookmarks = this.state.data;
        var newBookmarks = bookmarks.concat([listItem]);
        this.setState({data: newBookmarks});
      }.bind(this),
      error: function(xhr, status, err) {
        // trigger modal to alert user their post was unsuccessful
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },

  handleDelete: function(data) {
    $.ajax({
      url: `${this.props.url}/${data}`,  
      dataType: 'json',
      type: 'DELETE',
      headers: { 'Authorization': 'fizzy_pop'},
      success: function() {
      }.bind(this),
      error: function(xhr, status, err) {
        // TODO: trigger modal to alert user their post was unsuccessful
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });

    var updatedList = this.state.data;
    var index = updatedList.findIndex((listItem) => {
      return listItem.id === data;
    })
    updatedList.splice(index, 1);
    this.setState({data: updatedList});
    console.log(this.state.data);  
  },

  getInitialState: function() {
    return { data: [] };
  },
  componentDidMount: function() {
    this.loadListFromServer();
    setInterval(this.loadListFromServer, this.props.pollInterval);
  },
  render: function() {
    return (
      <div className="listing-app">
        <span className="header-title">My Bookmarks</span>
        <ListForm onListSubmit={this.handleListSubmit} />
        <BookmarkList list={this.state.data} onDelete={this.handleDelete} />
      </div>
    );
  }
});
 
var BookmarkList = React.createClass({

  deleteListing: function(e) {
    var $itemToDelete = $(e.target.parentElement).data() || $(e.target).data() ;
    this.props.onDelete($itemToDelete.id);
  },
  
  render: function() {
    var listNodes = this.props.list.map((bookmark) => {
      return (
        <div className="col-xs-12 listing-box">
          <ListItem title={bookmark.attributes.title} id={bookmark.id} >
            {bookmark.attributes.url} 
          </ListItem>
          <span className="js-delete listing-control" type="button" onClick={this.deleteListing} data-id={bookmark.id} >
             <span className="glyphicon glyphicon-trash" aria-hidden="true"></span> 
          </span>
        </div>
      );
    });
    return (
      <div>
         {listNodes} 
      </div>
    );
  }
});

var ListForm = React.createClass({
  getInitialState: function() {
    return {title: '', url: ''};
  },
  handleTitleChange: function(e) {
    this.setState({title: e.target.value});
  },
  handleUrlChange: function(e) {
    this.setState({url: e.target.value});
  },
  handleSubmit: function(e) {
    e.preventDefault();
    var title = this.state.title.trim();
    var url = this.state.url.trim();
    if (!title || !url) {
      return;
    }
    this.props.onListSubmit({title: title, url: url});
    this.setState({title: '', url: ''});
  },
  render: function() {
    return (
      <form className="listing-form form-inline" onSubmit={this.handleSubmit}>
        <div className="form-group">
          <input
            className="form-control"
            type="text"
            maxLength="30"
            placeholder="Site Title"
            value={this.state.title}
            onChange={this.handleTitleChange}
          />
        </div>
        <div className="form-group">
          <input
            className="form-control"
            type="text"
            placeholder="Site URL"
            value={this.state.url}
            onChange={this.handleUrlChange}
          />
        </div>
        <input className="btn btn-primary" type="submit" value="Enter" />
      </form>
    );
  }
});

ReactDOM.render(
  <BookmarkApp url="http://clientside-api.herokuapp.com/api/v1/listings" pollInterval={10000} />,
  document.getElementById('content')
);
