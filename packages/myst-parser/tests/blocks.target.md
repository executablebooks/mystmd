Header with ID:
.
(my_id)=
# My Header

{ref}`my_id`
.
<h1 id="my_id">My Header</h1>
<p><a href="#my_id" title="My Header">My Header</a></p>
.

Header with ID and labeled link:
.
(my_id)=
# My Header

{ref}`My Label <my_id>`
.
<h1 id="my_id">My Header</h1>
<p><a href="#my_id" title="My Header">My Label</a></p>
.

Reference to a non-existent ID:
.
(my_id)=
# My Header

{ref}`Not There <my_ID>`
.
<h1 id="my_id">My Header</h1>
<p><span class="error" title="The reference 'my_ID' was not found.">Reference 'my_ID' not found.</span></p>
.

Header with ID and a markdown link:
.
(my_id)=
# My Header

[My Label](my_id)
.
<h1 id="my_id">My Header</h1>
<p><a href="#my_id" title="My Header">My Label</a></p>
.
