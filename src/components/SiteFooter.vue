<template>
  <footer class="footer">
    <div class="shell">
      <div class="footer-grid">
        <div>
          <RouterLink to="/" class="brand" aria-label="Sabil Qalam home"
            ><span>Sabil Qalam</span></RouterLink
          >
          <p>A place for useful knowledge, thoughtful work and fair exchange.</p>
        </div>
        <div>
          <h4>Explore</h4>
          <div class="footer-links">
            <RouterLink to="/requests">Open requests</RouterLink
            ><RouterLink to="/experts">Experts</RouterLink
            ><RouterLink to="/how-it-works">How it works</RouterLink>
          </div>
        </div>
        <div>
          <h4>Account</h4>
          <div class="footer-links">
            <RouterLink to="/requests/new">Post a request</RouterLink
            ><RouterLink to="/login">Sign in</RouterLink
            ><RouterLink to="/register">Create account</RouterLink>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        © {{ new Date().getFullYear() }} Sabil Qalam. Built around knowledge that helps others.
      </div>
    </div>
  </footer>
</template>
