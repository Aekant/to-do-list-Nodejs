class APIFeatures {
  constructor(queryObj, queryStr) {
    // the constructor will create instance variables which holds the 
    // query and the query string
    this.query = queryObj;
    this.queryStr = queryStr;
  }

  // non of the methods are asynchronous because at this point
  // they are not querying database
  // they will query database only when the query is awaited in the
  // controller file
  filter() {
    // this method is going to be called by the object of this class
    // therefore this.queryObj holds the reference to our query 

    // Filtering
    // conditioning the query string
    // removing fields such as limit page which are for pagination etc
    let queryObj = { ...this.queryStr };
    const excluded = ['limit', 'page', 'sort', 'fields'];
    excluded.forEach(el => delete queryObj[el]);
    // removes all the fields which won't be in the documents

    // conditing the operators
    let queryStrOp = JSON.stringify(queryObj);
    queryStrOp = queryStrOp.replace(/\b(gt|gte|lt|lte)\b/g, match => `$${match}`);
    queryObj = JSON.parse(queryStrOp);
    this.query = this.query.find(queryObj);

    // returning the object so that further methods can be chained to 
    // this.query
    return this;
  }

  sort() {
    // Sorting if there is a sort query
    if (this.queryStr.sort) {
      // at this point sort is property of req object which has a string value
      // the string is a comma separated list of values by which we want to sort
      // the documents therefore 
      let sortStr = this.queryStr.sort.split(',').join(' ');
      this.query = this.query.sort(sortStr);
    } else {
      // adding a default sort
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  limit() {
    // Limiting fields if there is a fields query
    if (this.queryStr.fields) {
      let fieldsStr = this.queryStr.fields.split(',').join(' ');
      this.query = this.query.select(fieldsStr);
    } else {
      this.query = this.query.select('-__v')
    }

    return this;
  }

  paginate() {
    // Pagination
    let limit = this.queryStr.limit * 1 || 50
    // if the limit exists then fine otherwise the default results 
    // per page are 50 which are the max number of tasks a user can create
    let page = this.queryStr.page * 1 || 1;
    // default page is 1
    this.query = this.query.skip((page - 1) * limit).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;